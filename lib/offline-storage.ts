type StorageKey = string
type StorageValue = any

class OfflineStorage {
  private static instance: OfflineStorage
  private readonly PREFIX = "retail_bandhu_"
  private readonly SYNC_QUEUE_KEY = "sync_queue"
  private readonly MAX_STORAGE_SIZE_MB = 50 // 50MB limit
  private readonly BYTES_PER_MB = 1048576 // 1MB in bytes

  private constructor() {}

  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  private getFullKey(key: StorageKey): string {
    return `${this.PREFIX}${key}`
  }

  public set(key: StorageKey, value: StorageValue): boolean {
    try {
      const fullKey = this.getFullKey(key)
      const valueString = JSON.stringify(value)

      // Check if adding this item would exceed storage limits
      if (!this.hasEnoughSpace(fullKey, valueString)) {
        console.warn("Storage limit would be exceeded. Item not stored.")
        return false
      }

      localStorage.setItem(fullKey, valueString)
      return true
    } catch (error) {
      console.error("Error storing data:", error)
      return false
    }
  }

  public get<T = StorageValue>(key: StorageKey): T | null {
    try {
      const fullKey = this.getFullKey(key)
      const value = localStorage.getItem(fullKey)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Error retrieving data:", error)
      return null
    }
  }

  public remove(key: StorageKey): boolean {
    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
      return true
    } catch (error) {
      console.error("Error removing data:", error)
      return false
    }
  }

  public clear(): boolean {
    try {
      // Only clear keys with our prefix
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error("Error clearing data:", error)
      return false
    }
  }

  public addToSyncQueue(item: any): boolean {
    try {
      const queue = this.getSyncQueue()
      queue.push({
        ...item,
        timestamp: new Date().toISOString(),
        id: this.generateId(),
      })
      return this.set(this.SYNC_QUEUE_KEY, queue)
    } catch (error) {
      console.error("Error adding to sync queue:", error)
      return false
    }
  }

  public getSyncQueue(): any[] {
    return this.get<any[]>(this.SYNC_QUEUE_KEY) || []
  }

  public removeFromSyncQueue(id: string): boolean {
    try {
      const queue = this.getSyncQueue()
      const updatedQueue = queue.filter((item) => item.id !== id)
      return this.set(this.SYNC_QUEUE_KEY, updatedQueue)
    } catch (error) {
      console.error("Error removing from sync queue:", error)
      return false
    }
  }

  public clearSyncQueue(): boolean {
    return this.set(this.SYNC_QUEUE_KEY, [])
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private hasEnoughSpace(key: string, value: string): boolean {
    try {
      // Calculate size of new item
      const newItemSize = new Blob([key, value]).size

      // Calculate current storage size
      let currentSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ""
          currentSize += new Blob([key, value]).size
        }
      }

      // Check if adding new item would exceed limit
      const totalSizeInMB = (currentSize + newItemSize) / this.BYTES_PER_MB
      return totalSizeInMB <= this.MAX_STORAGE_SIZE_MB
    } catch (error) {
      console.error("Error calculating storage size:", error)
      return false
    }
  }

  public getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let currentSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ""
          currentSize += new Blob([key, value]).size
        }
      }

      const usedMB = currentSize / this.BYTES_PER_MB
      const totalMB = this.MAX_STORAGE_SIZE_MB
      const percentage = (usedMB / totalMB) * 100

      return {
        used: Number.parseFloat(usedMB.toFixed(2)),
        total: totalMB,
        percentage: Number.parseFloat(percentage.toFixed(2)),
      }
    } catch (error) {
      console.error("Error calculating storage usage:", error)
      return { used: 0, total: this.MAX_STORAGE_SIZE_MB, percentage: 0 }
    }
  }
}

export const offlineStorage = OfflineStorage.getInstance()
export default offlineStorage
