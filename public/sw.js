const CACHE_NAME = "retail-bandhu-v1"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/login",
  "/signup",
  "/manifest.json",
  "/favicon.ico",
  "/thoughtful-vikram.png",
  "/thoughtful-suresh.png",
  "/stylized-admin-panel.png",
  "/abstract-geometric-shapes.png",
]

// Install event - precache key assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      }),
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
      .then(() => {
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip Supabase API requests (these will be handled by the offline sync mechanism)
  if (event.request.url.includes("supabase.co")) {
    return
  }

  // For navigation requests (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      }),
    )
    return
  }

  // For other requests (assets, API calls)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response
      }

      // Otherwise try to fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone()

          // Cache the response for future
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // For image requests, return a placeholder
          if (event.request.destination === "image") {
            return caches.match("/placeholder.png")
          }

          // For API requests, return an empty JSON response
          if (event.request.url.includes("/api/")) {
            return new Response(
              JSON.stringify({
                error: "You are offline",
                offline: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            )
          }

          // For other assets, just fail
          return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          })
        })
    }),
  )
})

// Background sync for offline operations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-operations") {
    event.waitUntil(syncPendingOperations())
  }
})

// Function to sync pending operations
async function syncPendingOperations() {
  const db = await openDB()
  const pendingOperations = await db.getAll("pendingOperations")

  for (const operation of pendingOperations) {
    try {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: operation.body ? JSON.stringify(operation.body) : undefined,
      })

      if (response.ok) {
        // If successful, remove from pending operations
        await db.delete("pendingOperations", operation.id)

        // Notify clients that sync was successful
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_SUCCESS",
            operationId: operation.id,
            timestamp: new Date().toISOString(),
          })
        })
      }
    } catch (error) {
      console.error("Failed to sync operation:", error)
      // Will be retried on next sync event
    }
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RetailBandhuOfflineDB", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("pendingOperations")) {
        db.createObjectStore("pendingOperations", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("offlineData")) {
        db.createObjectStore("offlineData", { keyPath: "key" })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}
