"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { checkOnlineStatus, requestBackgroundSync } from "./service-worker"
import offlineSupabase from "./offline-supabase-client"
import indexedDBService from "./indexed-db"

interface OfflineContextType {
  isOnline: boolean
  hasPendingOperations: boolean
  pendingOperationsCount: number
  syncPendingOperations: () => Promise<any>
  lastSyncTime: Date | null
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  hasPendingOperations: false,
  pendingOperationsCount: 0,
  syncPendingOperations: async () => ({}),
  lastSyncTime: null,
})

export const useOffline = () => useContext(OfflineContext)

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOperations, setPendingOperations] = useState<any[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Check online status on mount and when it changes
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = checkOnlineStatus()
      setIsOnline(online)

      // If we just came back online, try to sync
      if (online && pendingOperations.length > 0) {
        requestBackgroundSync()
      }
    }

    // Set initial status
    updateOnlineStatus()

    // Add event listeners for online/offline events
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [pendingOperations.length])

  // Check for pending operations periodically
  useEffect(() => {
    const checkPendingOperations = async () => {
      try {
        const operations = await indexedDBService.getPendingOperations()
        setPendingOperations(operations)
      } catch (error) {
        console.error("Error checking pending operations:", error)
      }
    }

    // Check immediately
    checkPendingOperations()

    // Then check periodically
    const interval = setInterval(checkPendingOperations, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Listen for sync success messages from service worker
  useEffect(() => {
    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SYNC_SUCCESS") {
        // Refresh pending operations
        indexedDBService.getPendingOperations().then((operations) => {
          setPendingOperations(operations)
          setLastSyncTime(new Date())
        })
      }
    }

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSyncMessage)
    }

    return () => {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSyncMessage)
      }
    }
  }, [])

  // Update the syncPendingOperations function to handle the case when Service Worker is not available
  const syncPendingOperations = async () => {
    if (!isOnline) {
      return { success: false, message: "Device is offline" }
    }

    // Check if we're in the v0 preview environment
    const isV0Preview = typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")

    if (isV0Preview) {
      return { success: true, message: "Service Worker sync not available in preview mode" }
    }

    try {
      const result = await offlineSupabase.syncPendingOperations()

      // Refresh pending operations
      const operations = await indexedDBService.getPendingOperations()
      setPendingOperations(operations)

      // Update last sync time
      setLastSyncTime(new Date())

      return result
    } catch (error) {
      console.error("Error syncing pending operations:", error)
      return { success: false, error }
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        hasPendingOperations: pendingOperations.length > 0,
        pendingOperationsCount: pendingOperations.length,
        syncPendingOperations,
        lastSyncTime,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}
