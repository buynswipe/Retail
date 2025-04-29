import indexedDBService from "../indexed-db"

// Store events when offline
export async function storeOfflineEvent(eventData: any) {
  try {
    await indexedDBService.addItem("offline_events", eventData)
    return true
  } catch (error) {
    console.error("Error storing offline event:", error)
    return false
  }
}

// Sync offline events when back online
export async function syncOfflineEvents() {
  try {
    const offlineEvents = await indexedDBService.getAllItems("offline_events")

    if (!offlineEvents || offlineEvents.length === 0) {
      return { success: true, synced: 0 }
    }

    const { supabase } = await import("../supabase-client")

    // Process in batches of 50
    const batchSize = 50
    let successCount = 0

    for (let i = 0; i < offlineEvents.length; i += batchSize) {
      const batch = offlineEvents.slice(i, i + batchSize)

      const { error } = await supabase.from("analytics_events").insert(batch)

      if (!error) {
        // Remove synced events
        for (const event of batch) {
          await indexedDBService.deleteItem("offline_events", event.id)
        }

        successCount += batch.length
      } else {
        console.error("Error syncing offline events:", error)
      }
    }

    return {
      success: true,
      synced: successCount,
      remaining: offlineEvents.length - successCount,
    }
  } catch (error) {
    console.error("Error in syncOfflineEvents:", error)
    return { success: false, error }
  }
}
