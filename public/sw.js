// This is a simplified service worker for the Retail Bandhu application
// It handles offline caching and background sync

const CACHE_NAME = "retail-bandhu-v1"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/login",
  "/signup",
  "/manifest.json",
  "/favicon.ico",
  "/placeholder.png",
  "/UPI-symbol.png",
]

// Install event - precache key assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME
            })
            .map((cacheName) => {
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/_next/data/")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response to cache it and return it
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If the request is for a page, return the offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }

          // For image requests, return a placeholder
          if (event.request.destination === "image") {
            return caches.match("/placeholder.png")
          }

          // For other requests, just return a simple response
          return new Response("Offline content not available")
        })
    }),
  )
})

// Background sync for pending operations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-operations") {
    event.waitUntil(syncPendingOperations())
  }
})

// Function to sync pending operations
async function syncPendingOperations() {
  // This would be implemented to sync data from IndexedDB to the server
  // For now, we'll just log that sync was attempted
  console.log("Background sync triggered for pending operations")

  // In a real implementation, you would:
  // 1. Open IndexedDB
  // 2. Get all pending operations
  // 3. Send them to the server
  // 4. Mark them as synced if successful
}

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  } catch (error) {
    console.error("Error showing notification:", error)
  }
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data.url

      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
