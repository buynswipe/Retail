"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { offlineStorage } from "./offline-storage"
import { offlineSync } from "./offline-sync"
import { logger } from "./logger"

interface OfflineContextType {
  isOnline: boolean
  isSyncing: boolean
  queueLength: number
  storageUsage: {
    used: number
    total: number
    percentage: number
  }
  syncData: () => Promise<boolean>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [queueLength, setQueueLength] = useState<number>(0)
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 50, // Default 50MB
    percentage: 0,
  })

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      logger.info("Device is online")
    }

    const handleOffline = () => {
      setIsOnline(false)
      logger.info("Device is offline")
    }

    if (typeof window !== "undefined") {
      // Set initial values
      setIsOnline(navigator.onLine)
      updateSyncStatus()
      updateStorageUsage()

      // Add event listeners
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // Set up interval to update status
      const statusInterval = setInterval(() => {
        updateSyncStatus()
        updateStorageUsage()
      }, 5000)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
        clearInterval(statusInterval)
      }
    }
  }, [])

  const updateSyncStatus = () => {
    const status = offlineSync.getSyncStatus()
    setIsSyncing(status.isSyncing)
    setQueueLength(status.queueLength)
  }

  const updateStorageUsage = () => {
    setStorageUsage(offlineStorage.getStorageUsage())
  }

  const syncData = async () => {
    if (!isOnline || isSyncing) return false

    setIsSyncing(true)
    try {
      const result = await offlineSync.syncData()
      updateSyncStatus()
      return result
    } finally {
      setIsSyncing(false)
    }
  }

  const value = {
    isOnline,
    isSyncing,
    queueLength,
    storageUsage,
    syncData,
  }

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider")
  }
  return context
}
