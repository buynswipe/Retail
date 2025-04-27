"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, RefreshCw, Database } from "lucide-react"
import { useOffline } from "@/lib/offline-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function OfflineIndicator() {
  const { isOnline, isSyncing, queueLength, storageUsage, syncData } = useOffline()
  const [showTooltip, setShowTooltip] = useState(false)
  const [syncDetails, setSyncDetails] = useState<any[]>([])
  const [openDialog, setOpenDialog] = useState(false)

  // Show tooltip for 3 seconds when offline status changes
  useEffect(() => {
    setShowTooltip(true)
    const timer = setTimeout(() => setShowTooltip(false), 3000)
    return () => clearTimeout(timer)
  }, [isOnline])

  // Fetch sync queue details when dialog opens
  useEffect(() => {
    if (openDialog) {
      // In a real implementation, this would come from offlineStorage.getSyncQueue()
      setSyncDetails([
        {
          id: "1",
          table: "orders",
          operation: "insert",
          timestamp: new Date().toISOString(),
          data: { id: "ord123", amount: 500 },
        },
        {
          id: "2",
          table: "products",
          operation: "update",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          data: { id: "prod456", stock: 10 },
        },
      ])
    }
  }, [openDialog])

  if (isOnline && queueLength === 0) {
    return null // Don't show anything when online and no pending sync
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <div className="fixed bottom-4 right-4 z-50">
                <div className="flex items-center gap-2 rounded-full bg-background border shadow-lg p-2 cursor-pointer">
                  {isOnline ? (
                    <>
                      <Wifi className="h-5 w-5 text-green-500" />
                      {queueLength > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{queueLength} pending</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              syncData()
                            }}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                            <span className="sr-only">Sync data</span>
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-5 w-5 text-destructive" />
                      <span className="text-xs font-medium">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Offline Mode Status</DialogTitle>
                <DialogDescription>
                  {isOnline
                    ? "You're online. Pending changes will sync automatically."
                    : "You're working offline. Changes will sync when you reconnect."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {storageUsage.used.toFixed(1)} / {storageUsage.total} MB
                  </span>
                </div>
                <Progress value={storageUsage.percentage} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sync Status</span>
                  <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Changes</span>
                  <Badge variant={queueLength > 0 ? "secondary" : "outline"}>{queueLength}</Badge>
                </div>

                {queueLength > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pending Operations</span>
                    </div>
                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      {syncDetails.map((item) => (
                        <div key={item.id} className="mb-3 pb-3 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                item.operation === "insert"
                                  ? "default"
                                  : item.operation === "update"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="uppercase text-xs"
                            >
                              {item.operation}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{item.table}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground overflow-hidden text-ellipsis">
                            {JSON.stringify(item.data).substring(0, 50)}
                            {JSON.stringify(item.data).length > 50 ? "..." : ""}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                {queueLength > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      syncData()
                      if (isOnline) {
                        setOpenDialog(false)
                      }
                    }}
                    disabled={!isOnline || isSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setOpenDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent side="top" align="end">
          <div className="w-64 p-2">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{isOnline ? "Online" : "Offline"} Mode</span>
              <span className="text-xs">
                {storageUsage.used.toFixed(1)} / {storageUsage.total} MB
              </span>
            </div>
            <Progress value={storageUsage.percentage} className="h-2 mb-2" />
            {queueLength > 0 && (
              <div className="text-xs text-muted-foreground">
                {queueLength} {queueLength === 1 ? "change" : "changes"} pending synchronization
              </div>
            )}
            <div className="text-xs text-muted-foreground">Click for details</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
