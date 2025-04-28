import { supabase } from "./supabase-client"
import indexedDBService from "./indexed-db"
import { checkOnlineStatus, requestBackgroundSync } from "./service-worker"

// Types for offline operations
type OfflineOperationType = "insert" | "update" | "delete" | "upsert"

interface OfflineOperationOptions {
  table: string
  data: any
  id?: string
  match?: Record<string, any>
}

class OfflineSupabaseClient {
  // Insert data with offline support
  async insert(options: OfflineOperationOptions) {
    const { table, data } = options

    if (checkOnlineStatus()) {
      // If online, try to insert directly
      try {
        const { data: result, error } = await supabase.from(table).insert(data).select()

        if (error) throw error

        // Cache the result for offline use
        await this.cacheTableData(table, data.id || result[0].id, result[0])

        return { data: result, error: null, offline: false }
      } catch (error) {
        console.error("Error inserting data:", error)
        return this.handleOfflineOperation("insert", options)
      }
    } else {
      // If offline, queue the operation
      return this.handleOfflineOperation("insert", options)
    }
  }

  // Update data with offline support
  async update(options: OfflineOperationOptions) {
    const { table, data, match } = options

    if (checkOnlineStatus()) {
      // If online, try to update directly
      try {
        let query = supabase.from(table).update(data)

        // Apply match conditions if provided
        if (match) {
          Object.entries(match).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        } else if (data.id) {
          query = query.eq("id", data.id)
        }

        const { data: result, error } = await query.select()

        if (error) throw error

        // Cache the updated data
        if (result && result.length > 0) {
          await this.cacheTableData(table, result[0].id, result[0])
        }

        return { data: result, error: null, offline: false }
      } catch (error) {
        console.error("Error updating data:", error)
        return this.handleOfflineOperation("update", options)
      }
    } else {
      // If offline, queue the operation
      return this.handleOfflineOperation("update", options)
    }
  }

  // Delete data with offline support
  async delete(options: OfflineOperationOptions) {
    const { table, match } = options

    if (checkOnlineStatus()) {
      // If online, try to delete directly
      try {
        let query = supabase.from(table).delete()

        // Apply match conditions
        if (match) {
          Object.entries(match).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        const { data: result, error } = await query

        if (error) throw error

        return { data: result, error: null, offline: false }
      } catch (error) {
        console.error("Error deleting data:", error)
        return this.handleOfflineOperation("delete", options)
      }
    } else {
      // If offline, queue the operation
      return this.handleOfflineOperation("delete", options)
    }
  }

  // Select data with offline support
  async select(table: string, id?: string, query?: any) {
    if (checkOnlineStatus()) {
      // If online, try to fetch from Supabase
      try {
        let supabaseQuery = supabase.from(table).select(query || "*")

        if (id) {
          supabaseQuery = supabaseQuery.eq("id", id)
        }

        const { data, error } = await supabaseQuery

        if (error) throw error

        // Cache the data for offline use
        if (id && data && data.length > 0) {
          await this.cacheTableData(table, id, data[0])
        } else if (data) {
          await this.cacheTableData(table, "all", data)
        }

        return { data, error: null, offline: false }
      } catch (error) {
        console.error("Error fetching data:", error)
        // Fall back to offline data
        return this.getOfflineData(table, id)
      }
    } else {
      // If offline, get from cache
      return this.getOfflineData(table, id)
    }
  }

  // Handle offline operations by storing them for later sync
  private async handleOfflineOperation(type: OfflineOperationType, options: OfflineOperationOptions) {
    const { table, data, match } = options

    try {
      // Generate a temporary ID for new items
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store the operation for later sync
      const operationId = await indexedDBService.addPendingOperation({
        url: `${supabase.supabaseUrl}/rest/v1/${table}`,
        method: type === "delete" ? "DELETE" : type === "insert" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabase.supabaseKey}`,
          Prefer: type === "upsert" ? "resolution=merge-duplicates" : "return=representation",
        },
        body: type === "delete" ? match : data,
        type,
        entityId: data?.id || (match?.id as string),
      })

      // For inserts, we need to cache the data with a temporary ID
      if (type === "insert") {
        const newData = { ...data, id: data.id || tempId, _offline: true, _operationId: operationId }
        await this.cacheTableData(table, newData.id, newData)
        return { data: [newData], error: null, offline: true, operationId }
      }

      // For updates, we need to update the cached data
      if (type === "update" && (data.id || match?.id)) {
        const id = data.id || match?.id
        const existingData = await indexedDBService.getOfflineData(`${table}:${id}`)

        if (existingData) {
          const updatedData = { ...existingData, ...data, _offline: true, _operationId: operationId }
          await this.cacheTableData(table, id, updatedData)
          return { data: [updatedData], error: null, offline: true, operationId }
        }
      }

      // For deletes, we mark the item as deleted in cache
      if (type === "delete" && match?.id) {
        const existingData = await indexedDBService.getOfflineData(`${table}:${match.id}`)

        if (existingData) {
          const deletedData = { ...existingData, _deleted: true, _offline: true, _operationId: operationId }
          await this.cacheTableData(table, match.id, deletedData)
        }
      }

      // Request background sync if available
      requestBackgroundSync()

      return { data: null, error: null, offline: true, operationId }
    } catch (error) {
      console.error("Error handling offline operation:", error)
      return { data: null, error: "Failed to store offline operation", offline: true }
    }
  }

  // Cache table data for offline use
  private async cacheTableData(table: string, id: string, data: any) {
    await indexedDBService.storeOfflineData(`${table}:${id}`, data)

    // Also update the 'all' cache if it exists
    const allData = await indexedDBService.getOfflineData(`${table}:all`)
    if (allData) {
      if (Array.isArray(allData)) {
        // If data has _deleted flag, remove it from the array
        if (data._deleted) {
          const updatedAllData = allData.filter((item) => item.id !== id)
          await indexedDBService.storeOfflineData(`${table}:all`, updatedAllData)
        } else {
          // Otherwise update or add the item
          const index = allData.findIndex((item) => item.id === id)
          if (index >= 0) {
            allData[index] = data
          } else {
            allData.push(data)
          }
          await indexedDBService.storeOfflineData(`${table}:all`, allData)
        }
      }
    }
  }

  // Get data from offline storage
  private async getOfflineData(table: string, id?: string) {
    try {
      if (id) {
        const data = await indexedDBService.getOfflineData(`${table}:${id}`)
        return { data: data ? [data] : null, error: null, offline: true }
      } else {
        const data = await indexedDBService.getOfflineData(`${table}:all`)
        // Filter out deleted items
        const filteredData = data ? data.filter((item) => !item._deleted) : null
        return { data: filteredData, error: null, offline: true }
      }
    } catch (error) {
      console.error("Error getting offline data:", error)
      return { data: null, error: "Failed to retrieve offline data", offline: true }
    }
  }

  // Get all pending operations
  async getPendingOperations() {
    return indexedDBService.getPendingOperations()
  }

  // Sync all pending operations
  async syncPendingOperations() {
    if (!checkOnlineStatus()) {
      return { success: false, message: "Device is offline" }
    }

    const operations = await indexedDBService.getPendingOperations()
    const results = []

    for (const operation of operations) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body ? JSON.stringify(operation.body) : undefined,
        })

        if (response.ok) {
          const result = await response.json()
          await indexedDBService.deletePendingOperation(operation.id)

          // If this was a successful operation, update the cached data
          if (operation.entityId && operation.type !== "delete") {
            const tableName = operation.url.split("/").pop() as string
            if (result && result.length > 0) {
              await this.cacheTableData(tableName, operation.entityId, result[0])
            }
          }

          results.push({ id: operation.id, success: true, result })
        } else {
          results.push({ id: operation.id, success: false, error: await response.text() })
        }
      } catch (error) {
        console.error("Error syncing operation:", error)
        results.push({ id: operation.id, success: false, error })
      }
    }

    return { success: true, results }
  }
}

// Create a singleton instance
const offlineSupabase = new OfflineSupabaseClient()
export default offlineSupabase
