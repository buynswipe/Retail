// IndexedDB service with improved error handling and retry mechanisms

const DB_NAME = "RetailBandhuDB"
const DB_VERSION = 1
const OFFLINE_STORE = "offlineData"
const PENDING_OPS_STORE = "pendingOperations"

interface PendingOperation {
  id?: number
  type: string
  data: any
  timestamp: string
  retryCount?: number
}

class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor() {
    this.initDB()
  }

  private initDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error("IndexedDB is not supported in this browser"))
          return
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = (event) => {
          console.error("IndexedDB error:", event)
          reject(new Error("Failed to open IndexedDB"))
        }

        request.onsuccess = () => {
          resolve(request.result)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create stores if they don't exist
          if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
            db.createObjectStore(OFFLINE_STORE, { keyPath: "key" })
          }

          if (!db.objectStoreNames.contains(PENDING_OPS_STORE)) {
            const pendingOpsStore = db.createObjectStore(PENDING_OPS_STORE, {
              keyPath: "id",
              autoIncrement: true,
            })
            pendingOpsStore.createIndex("timestamp", "timestamp", { unique: false })
          }
        }
      })
    }

    return this.dbPromise
  }

  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([OFFLINE_STORE], "readwrite")
        const store = transaction.objectStore(OFFLINE_STORE)

        const request = store.put({ key, data })

        request.onsuccess = () => resolve()
        request.onerror = (event) => {
          console.error("Error storing offline data:", event)
          reject(new Error("Failed to store offline data"))
        }

        // Add transaction error handling
        transaction.onerror = (event) => {
          console.error("Transaction error while storing offline data:", event)
          reject(new Error("Transaction failed while storing offline data"))
        }
      })
    } catch (error) {
      console.error("Error in storeOfflineData:", error)
      throw error
    }
  }

  async getOfflineData(key: string): Promise<any> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([OFFLINE_STORE], "readonly")
        const store = transaction.objectStore(OFFLINE_STORE)

        const request = store.get(key)

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.data)
          } else {
            resolve(null)
          }
        }

        request.onerror = (event) => {
          console.error("Error getting offline data:", event)
          reject(new Error("Failed to get offline data"))
        }
      })
    } catch (error) {
      console.error("Error in getOfflineData:", error)
      throw error
    }
  }

  async removeOfflineData(key: string): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([OFFLINE_STORE], "readwrite")
        const store = transaction.objectStore(OFFLINE_STORE)

        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = (event) => {
          console.error("Error removing offline data:", event)
          reject(new Error("Failed to remove offline data"))
        }
      })
    } catch (error) {
      console.error("Error in removeOfflineData:", error)
      throw error
    }
  }

  async storePendingOperation(operation: PendingOperation): Promise<number> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([PENDING_OPS_STORE], "readwrite")
        const store = transaction.objectStore(PENDING_OPS_STORE)

        // Initialize retry count if not present
        if (operation.retryCount === undefined) {
          operation.retryCount = 0
        }

        const request = store.add(operation)

        request.onsuccess = () => resolve(request.result as number)
        request.onerror = (event) => {
          console.error("Error storing pending operation:", event)
          reject(new Error("Failed to store pending operation"))
        }
      })
    } catch (error) {
      console.error("Error in storePendingOperation:", error)
      throw error
    }
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([PENDING_OPS_STORE], "readonly")
        const store = transaction.objectStore(PENDING_OPS_STORE)
        const index = store.index("timestamp")

        const request = index.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = (event) => {
          console.error("Error getting pending operations:", event)
          reject(new Error("Failed to get pending operations"))
        }
      })
    } catch (error) {
      console.error("Error in getPendingOperations:", error)
      // Return empty array instead of throwing to prevent UI errors
      return []
    }
  }

  async removePendingOperation(id: number): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([PENDING_OPS_STORE], "readwrite")
        const store = transaction.objectStore(PENDING_OPS_STORE)

        const request = store.delete(id)

        request.onsuccess = () => resolve()
        request.onerror = (event) => {
          console.error("Error removing pending operation:", event)
          reject(new Error("Failed to remove pending operation"))
        }
      })
    } catch (error) {
      console.error("Error in removePendingOperation:", error)
      throw error
    }
  }

  async updatePendingOperation(id: number, updates: Partial<PendingOperation>): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([PENDING_OPS_STORE], "readwrite")
        const store = transaction.objectStore(PENDING_OPS_STORE)

        // First get the existing operation
        const getRequest = store.get(id)

        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            reject(new Error(`Pending operation with ID ${id} not found`))
            return
          }

          // Update the operation
          const updatedOperation = { ...getRequest.result, ...updates }
          const putRequest = store.put(updatedOperation)

          putRequest.onsuccess = () => resolve()
          putRequest.onerror = (event) => {
            console.error("Error updating pending operation:", event)
            reject(new Error("Failed to update pending operation"))
          }
        }

        getRequest.onerror = (event) => {
          console.error("Error getting pending operation for update:", event)
          reject(new Error("Failed to get pending operation for update"))
        }
      })
    } catch (error) {
      console.error("Error in updatePendingOperation:", error)
      throw error
    }
  }

  async clearAllPendingOperations(): Promise<void> {
    try {
      const db = await this.initDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([PENDING_OPS_STORE], "readwrite")
        const store = transaction.objectStore(PENDING_OPS_STORE)

        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = (event) => {
          console.error("Error clearing pending operations:", event)
          reject(new Error("Failed to clear pending operations"))
        }
      })
    } catch (error) {
      console.error("Error in clearAllPendingOperations:", error)
      throw error
    }
  }

  // Check if IndexedDB is supported and working
  async isSupported(): Promise<boolean> {
    if (!window.indexedDB) {
      return false
    }

    try {
      await this.initDB()
      return true
    } catch (error) {
      console.error("IndexedDB support check failed:", error)
      return false
    }
  }

  // Get database size estimation
  async getDatabaseSize(): Promise<{ stores: Record<string, number>; totalEntries: number }> {
    try {
      const db = await this.initDB()
      const stores = [OFFLINE_STORE, PENDING_OPS_STORE]
      const result: Record<string, number> = {}
      let totalEntries = 0

      const countPromises = stores.map((storeName) => {
        return new Promise<number>((resolve) => {
          const transaction = db.transaction([storeName], "readonly")
          const store = transaction.objectStore(storeName)
          const countRequest = store.count()

          countRequest.onsuccess = () => {
            const count = countRequest.result
            result[storeName] = count
            totalEntries += count
            resolve(count)
          }

          countRequest.onerror = () => {
            console.error(`Error counting entries in ${storeName}`)
            result[storeName] = 0
            resolve(0)
          }
        })
      })

      await Promise.all(countPromises)
      return { stores: result, totalEntries }
    } catch (error) {
      console.error("Error getting database size:", error)
      return { stores: {}, totalEntries: 0 }
    }
  }
}

const indexedDBService = new IndexedDBService()
export default indexedDBService
