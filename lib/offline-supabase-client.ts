import { supabase } from "./supabase-client"
import indexedDBService from "./indexed-db"
import { checkOnlineStatus, requestBackgroundSync } from "./service-worker"
import { updateFetchStatus } from "./service-worker"

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

  // Sync pending operations with exponential backoff and improved error handling
  async syncPendingOperations(): Promise<{
    success: boolean
    synced: number
    failed: number
    message?: string
    details?: any[]
  }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        return { success: false, synced: 0, failed: 0, message: "Device is offline" }
      }

      // Get all pending operations
      const pendingOperations = await indexedDBService.getPendingOperations()

      if (pendingOperations.length === 0) {
        return { success: true, synced: 0, failed: 0, message: "No pending operations to sync" }
      }

      let synced = 0
      let failed = 0
      const failedDetails: any[] = []

      // Process operations in order
      for (const operation of pendingOperations) {
        try {
          let success = false

          // Process based on operation type
          switch (operation.type) {
            case "upsert_cart_item":
              success = await this.syncCartItem(operation.data)
              break
            case "delete_cart_item":
              success = await this.deleteCartItem(operation.data)
              break
            case "clear_cart":
              success = await this.clearCart(operation.data.user_id)
              break
            // Add more operation types as needed
            default:
              console.warn(`Unknown operation type: ${operation.type}`)
              success = false
          }

          if (success) {
            // Operation succeeded, remove from pending
            await indexedDBService.removePendingOperation(operation.id!)
            synced++

            // Update fetch status to indicate successful connection
            updateFetchStatus(true)
          } else {
            // Operation failed
            failed++
            failedDetails.push({
              id: operation.id,
              type: operation.type,
              data: operation.data,
              error: "Operation failed",
            })

            // Increment retry count
            const retryCount = (operation.retryCount || 0) + 1

            if (retryCount < 5) {
              // Update retry count and keep in pending
              await indexedDBService.updatePendingOperation(operation.id!, {
                retryCount,
                timestamp: new Date().toISOString(), // Update timestamp for ordering
              })
            } else {
              // Too many retries, mark as failed but keep for manual retry
              await indexedDBService.updatePendingOperation(operation.id!, {
                retryCount,
                timestamp: new Date().toISOString(),
                data: {
                  ...operation.data,
                  syncFailed: true,
                  lastAttempt: new Date().toISOString(),
                },
              })
            }
          }
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error)
          failed++
          failedDetails.push({
            id: operation.id,
            type: operation.type,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      // Notify service worker about sync completion
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SYNC_COMPLETED",
          synced,
          failed,
        })
      }

      return {
        success: failed === 0,
        synced,
        failed,
        message: `Synced ${synced} operations, failed ${failed} operations`,
        details: failed > 0 ? failedDetails : undefined,
      }
    } catch (error) {
      console.error("Error syncing pending operations:", error)
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: `Sync error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: [
          {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
      }
    }
  }

  // Sync a cart item (insert or update)
  private async syncCartItem(data: any): Promise<boolean> {
    try {
      const { user_id, product_id, quantity } = data

      // Check if item exists
      const { data: existingItems, error: fetchError } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user_id)
        .eq("product_id", product_id)

      if (fetchError) throw fetchError

      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", existingItems[0].id)

        if (updateError) throw updateError
      } else {
        // Insert new item
        const { error: insertError } = await supabase.from("cart_items").insert({
          user_id,
          product_id,
          quantity,
        })

        if (insertError) throw insertError
      }

      return true
    } catch (error) {
      console.error("Error syncing cart item:", error)
      return false
    }
  }

  // Delete a cart item
  private async deleteCartItem(data: any): Promise<boolean> {
    try {
      const { user_id, product_id } = data

      const { error } = await supabase.from("cart_items").delete().eq("user_id", user_id).eq("product_id", product_id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Error deleting cart item:", error)
      return false
    }
  }

  // Clear all cart items for a user
  private async clearCart(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Error clearing cart:", error)
      return false
    }
  }
}

// Create a singleton instance
const offlineSupabase = new OfflineSupabaseClient()
export default offlineSupabase
