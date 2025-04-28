export interface PendingOperation {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body?: any
  timestamp: number
  type: string
  entityId?: string
}

export interface OfflineData {
  key: string
  data: any
  timestamp: number
}

class IndexedDBService {
  private dbName = "RetailBandhuOfflineDB"
  private dbVersion = 1
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db)
        return
      }

      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not supported in this browser"))
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains("pendingOperations")) {
          db.createObjectStore("pendingOperations", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("offlineData")) {
          db.createObjectStore("offlineData", { keyPath: "key" })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(this.db)
      }

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }

  // Add a pending operation to be synced when online
  async addPendingOperation(operation: Omit<PendingOperation, "id" | "timestamp">): Promise<string> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const transaction = db.transaction(["pendingOperations"], "readwrite")
      const store = transaction.objectStore("pendingOperations")

      const request = store.add({
        ...operation,
        id,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all pending operations
  async getPendingOperations(): Promise<PendingOperation[]> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingOperations"], "readonly")
      const store = transaction.objectStore("pendingOperations")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Delete a pending operation
  async deletePendingOperation(id: string): Promise<void> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["pendingOperations"], "readwrite")
      const store = transaction.objectStore("pendingOperations")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Store data for offline use
  async storeOfflineData(key: string, data: any): Promise<void> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineData"], "readwrite")
      const store = transaction.objectStore("offlineData")

      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get stored offline data
  async getOfflineData(key: string): Promise<any> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineData"], "readonly")
      const store = transaction.objectStore("offlineData")
      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Delete stored offline data
  async deleteOfflineData(key: string): Promise<void> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineData"], "readwrite")
      const store = transaction.objectStore("offlineData")
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    const db = await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineData"], "readwrite")
      const store = transaction.objectStore("offlineData")
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Create a singleton instance
const indexedDBService = new IndexedDBService()
export default indexedDBService
