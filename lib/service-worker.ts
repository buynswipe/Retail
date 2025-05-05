export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)

          // Check for updates every hour
          setInterval(
            () => {
              registration.update()
            },
            60 * 60 * 1000,
          )

          // Listen for controller change to notify user of new content
          let refreshing = false
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return
            refreshing = true

            // Show notification to user that new content is available
            if (document.getElementById("update-notification")) {
              document.getElementById("update-notification")!.classList.remove("hidden")
            } else {
              const notification = document.createElement("div")
              notification.id = "update-notification"
              notification.className = "fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50"
              notification.innerHTML = `
                <p>New content is available!</p>
                <button class="mt-2 bg-white text-blue-600 px-4 py-1 rounded">Refresh</button>
              `
              document.body.appendChild(notification)

              notification.querySelector("button")?.addEventListener("click", () => {
                window.location.reload()
              })
            }
          })
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
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

// Function to check if app can work offline
export function checkOfflineCapability(): boolean {
  if (typeof window === "undefined") return false

  // Check if service worker is supported and registered
  const isServiceWorkerRegistered = "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller)

  // Check if IndexedDB is available
  const isIndexedDBAvailable = "indexedDB" in window

  // Check if Cache API is available
  const isCacheAvailable = "caches" in window

  return isServiceWorkerRegistered && isIndexedDBAvailable && isCacheAvailable
}

// Function to prefetch critical resources
export async function prefetchCriticalResources(resources: string[]) {
  if (!("caches" in window)) return

  try {
    const cache = await caches.open("critical-resources")
    await cache.addAll(resources)
    console.log("Critical resources prefetched successfully")
  } catch (error) {
    console.error("Failed to prefetch critical resources:", error)
  }
}

// Function to request background sync for offline operations
export async function requestBackgroundSync(tag = "sync-pending-operations"): Promise<boolean> {
  if (typeof window === "undefined") return false

  // Check if service worker and background sync are supported
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    console.warn("Background sync is not supported in this browser")
    return false
  }

  try {
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready

    // Register for background sync with the given tag
    await registration.sync.register(tag)
    console.log(`Background sync registered with tag: ${tag}`)
    return true
  } catch (error) {
    console.error("Failed to register background sync:", error)
    return false
  }
}
