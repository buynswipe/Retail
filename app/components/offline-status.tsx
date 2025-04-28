"use client"

import { useEffect, useState } from "react"
import { useOffline } from "@/lib/offline-context"
import { Wifi, WifiOff, CloudIcon as CloudSync, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function OfflineStatus() {
  const { isOnline, hasPendingOperations, pendingOperationsCount, syncPendingOperations, lastSyncTime } = useOffline()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null)

  // Reset sync status after a delay
  useEffect(() => {
    if (syncSuccess !== null) {
      const timer = setTimeout(() => {
        setSyncSuccess(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [syncSuccess])

  const handleSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncPendingOperations()
      setSyncSuccess(result.success)
    } catch (error) {
      setSyncSuccess(false)
      console.error("Error syncing:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline && !hasPendingOperations) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-green-600">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Online</span>
              {lastSyncTime && (
                <span className="hidden lg:inline ml-1 text-xs text-gray-500">
                  Last sync: {format(lastSyncTime, "HH:mm")}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You're online and all data is synced</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-yellow-600">
              <WifiOff className="h-4 w-4 mr-1" />
              <span>Offline</span>
              {hasPendingOperations && (
                <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-600">
                  {pendingOperationsCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You're offline. Changes will sync when you're back online.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-blue-600">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Online</span>
              <Badge variant="outline" className="ml-2 text-blue-600 border-blue-600">
                {pendingOperationsCount}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You have {pendingOperationsCount} pending changes to sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing} className="ml-2 h-8 px-2">
        {isSyncing ? (
          <CloudSync className="h-4 w-4 animate-spin" />
        ) : syncSuccess === true ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : syncSuccess === false ? (
          <AlertCircle className="h-4 w-4 text-red-600" />
        ) : (
          <CloudSync className="h-4 w-4" />
        )}
        <span className="ml-1 hidden md:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
      </Button>
    </div>
  )
}
