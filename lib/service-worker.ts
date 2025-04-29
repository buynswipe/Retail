export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    // Check if we're in the v0 preview environment
    const isV0Preview = window.location.hostname.includes("vusercontent.net")

    // Skip service worker registration in v0 preview
    if (isV0Preview) {
      console.log("Skipping Service Worker registration in v0 preview environment")
      return
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("Service Worker registration failed: ", registrationError)
        })
    })
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

// Update the checkOnlineStatus function with more reliable checks
export function checkOnlineStatus(): boolean {
  if (typeof window !== "undefined") {
    // In v0 preview, always return true to avoid offline-related issues
    const isV0Preview = window.location.hostname.includes("vusercontent.net")
    if (isV0Preview) {
      return true
    }

    // Check both navigator.onLine and recent fetch success
    const onlineStatus = navigator.onLine
    const lastFetchSuccess = localStorage.getItem("lastFetchSuccess")
    const lastFetchTime = localStorage.getItem("lastFetchTime")

    // If navigator says we're offline, we're definitely offline
    if (!onlineStatus) {
      return false
    }

    // If we have a recent successful fetch (within last 30 seconds), we're online
    if (lastFetchSuccess === "true" && lastFetchTime) {
      const timeSinceLastFetch = Date.now() - Number.parseInt(lastFetchTime, 10)
      if (timeSinceLastFetch < 30000) {
        // 30 seconds
        return true
      }
    }

    // Default to navigator.onLine if we don't have recent fetch data
    return onlineStatus
  }

  return true // Default to true for server-side rendering
}

// Function to update fetch status
export function updateFetchStatus(success: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("lastFetchSuccess", success.toString())
    localStorage.setItem("lastFetchTime", Date.now().toString())
  }
}

// Update the requestBackgroundSync function with better error handling
export function requestBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    // Check if we're in the v0 preview environment
    const isV0Preview = window.location.hostname.includes("vusercontent.net")

    // Skip background sync in v0 preview
    if (isV0Preview) {
      console.log("Background sync not available in v0 preview environment")
      return Promise.resolve(false)
    }

    return navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync
          .register("sync-pending-operations")
          .then(() => true)
          .catch((err) => {
            console.error("Background sync could not be registered:", err)
            return false
          })
      })
      .catch((err) => {
        console.error("Service worker not ready for background sync:", err)
        return false
      })
  }

  return Promise.resolve(false)
}

// Add a function to check if service worker and background sync are supported
export function checkBackgroundSyncSupport(): { serviceWorker: boolean; backgroundSync: boolean } {
  if (typeof window === "undefined") {
    return { serviceWorker: false, backgroundSync: false }
  }

  const serviceWorkerSupported = "serviceWorker" in navigator
  const backgroundSyncSupported = "SyncManager" in window

  return {
    serviceWorker: serviceWorkerSupported,
    backgroundSync: backgroundSyncSupported,
  }
}

// Add a function to manually trigger sync of pending operations
export async function syncPendingOperations() {
  if (typeof window !== "undefined") {
    try {
      // First try background sync if available
      const syncSupport = checkBackgroundSyncSupport()
      if (syncSupport.serviceWorker && syncSupport.backgroundSync) {
        const registered = await requestBackgroundSync()
        if (registered) {
          return { success: true, method: "background-sync" }
        }
      }

      // Fall back to manual sync via the offline-supabase-client
      const offlineSupabase = (await import("./offline-supabase-client")).default
      const result = await offlineSupabase.syncPendingOperations()
      return { ...result, method: "manual-sync" }
    } catch (error) {
      console.error("Error syncing pending operations:", error)
      return { success: false, error, method: "failed" }
    }
  }

  return { success: false, error: "Not in browser environment", method: "failed" }
}
