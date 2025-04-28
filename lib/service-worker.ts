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

// Update the checkOnlineStatus function
export function checkOnlineStatus(): boolean {
  if (typeof window !== "undefined") {
    // In v0 preview, always return true to avoid offline-related issues
    const isV0Preview = window.location.hostname.includes("vusercontent.net")
    if (isV0Preview) {
      return true
    }

    return navigator.onLine
  }
  return true // Default to true for server-side rendering
}

// Update the requestBackgroundSync function
export function requestBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    // Check if we're in the v0 preview environment
    const isV0Preview = window.location.hostname.includes("vusercontent.net")

    // Skip background sync in v0 preview
    if (isV0Preview) {
      console.log("Background sync not available in v0 preview environment")
      return
    }

    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register("sync-pending-operations")
      })
      .catch((err) => {
        console.error("Background sync could not be registered:", err)
      })
  }
}
