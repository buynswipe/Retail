export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      const swUrl = `${window.location.origin}/sw.js`
      navigator.serviceWorker
        .register(swUrl)
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

export function checkOnlineStatus(): boolean {
  if (typeof window !== "undefined") {
    return navigator.onLine
  }
  return true // Default to true for server-side rendering
}

export function requestBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register("sync-pending-operations")
      })
      .catch((err) => {
        console.error("Background sync could not be registered:", err)
      })
  }
}
