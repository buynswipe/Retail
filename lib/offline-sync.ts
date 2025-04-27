import { offlineStorage } from "./offline-storage"
import { logger } from "./logger"
import { createClient } from "./supabase-browser"

interface SyncItem {
  id: string
  table: string
  operation: "insert" | "update" | "delete"
  data: any
  timestamp: string
}

class OfflineSync {
  private static instance: OfflineSync
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL_MS = 30000 // 30 seconds

  private constructor() {
    this.setupSyncInterval()
    this.setupOnlineListener()
  }

  public static getInstance(): OfflineSync {
    if (!OfflineSync.instance) {
      OfflineSync.instance = new OfflineSync()
    }
    return OfflineSync.instance
  }

  private setupSyncInterval(): void {
    if (typeof window !== "undefined") {
      this.syncInterval = setInterval(() => {
        if (navigator.onLine) {
          this.syncData()
        }
      }, this.SYNC_INTERVAL_MS)
    }
  }

  private setupOnlineListener(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        logger.info("Device is online. Starting sync...")
        this.syncData()
      })

      window.addEventListener("offline", () => {
        logger.info("Device is offline. Sync paused.")
      })
    }
  }

  public async addOperation(table: string, operation: "insert" | "update" | "delete", data: any): Promise<boolean> {
    try {
      const syncItem: Omit<SyncItem, "id" | "timestamp"> = {
        table,
        operation,
        data,
      }

      const result = offlineStorage.addToSyncQueue(syncItem)

      if (result) {
        logger.info(`Added ${operation} operation to sync queue for ${table}`, { data })

        // Try to sync immediately if online
        if (navigator.onLine) {
          this.syncData()
        }
      }

      return result
    } catch (error) {
      logger.error("Error adding operation to sync queue", { error, table, operation, data })
      return false
    }
  }

  public async syncData(): Promise<boolean> {
    if (this.isSyncing || !navigator.onLine) {
      return false
    }

    this.isSyncing = true
    logger.info("Starting data synchronization")

    try {
      const queue = offlineStorage.getSyncQueue()

      if (queue.length === 0) {
        logger.info("Sync queue is empty")
        this.isSyncing = false
        return true
      }

      logger.info(`Processing ${queue.length} items in sync queue`)

      const supabase = createClient()
      const results = []

      // Process items in order (oldest first)
      for (const item of queue) {
        try {
          let result

          switch (item.operation) {
            case "insert":
              result = await supabase.from(item.table).insert(item.data)
              break

            case "update":
              result = await supabase.from(item.table).update(item.data.values).match(item.data.match)
              break

            case "delete":
              result = await supabase.from(item.table).delete().match(item.data)
              break

            default:
              logger.warn(`Unknown operation type: ${item.operation}`)
              continue
          }

          if (result.error) {
            logger.error(`Error syncing item: ${item.id}`, {
              error: result.error,
              item,
            })
            results.push({ success: false, id: item.id, error: result.error })
          } else {
            logger.info(`Successfully synced item: ${item.id}`, {
              operation: item.operation,
              table: item.table,
            })
            offlineStorage.removeFromSyncQueue(item.id)
            results.push({ success: true, id: item.id })
          }
        } catch (error) {
          logger.error(`Exception syncing item: ${item.id}`, { error, item })
          results.push({ success: false, id: item.id, error })
        }
      }

      const successCount = results.filter((r) => r.success).length
      logger.info(`Sync completed. ${successCount}/${queue.length} items synced successfully.`)

      return successCount === queue.length
    } catch (error) {
      logger.error("Error during sync process", { error })
      return false
    } finally {
      this.isSyncing = false
    }
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }

  public getSyncStatus(): {
    isSyncing: boolean
    queueLength: number
    isOnline: boolean
  } {
    return {
      isSyncing: this.isSyncing,
      queueLength: offlineStorage.getSyncQueue().length,
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
    }
  }
}

export const offlineSync = OfflineSync.getInstance()
export default offlineSync
