"use client"

import { useState, useEffect } from "react"

// Custom hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

// Function to check if the server is reachable
export async function checkServerConnectivity(endpoint = "/api/health-check"): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(endpoint, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    return false
  }
}

// Custom hook for server connectivity
export function useServerConnectivity(endpoint = "/api/health-check", pollingInterval = 30000) {
  const [isServerReachable, setIsServerReachable] = useState<boolean>(true)
  const isOnline = useNetworkStatus()

  useEffect(() => {
    if (!isOnline) {
      setIsServerReachable(false)
      return
    }

    let mounted = true
    let intervalId: NodeJS.Timeout

    const checkConnectivity = async () => {
      if (!mounted) return

      const isReachable = await checkServerConnectivity(endpoint)
      if (mounted) {
        setIsServerReachable(isReachable)
      }
    }

    // Check immediately
    checkConnectivity()

    // Then set up polling
    intervalId = setInterval(checkConnectivity, pollingInterval)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [endpoint, pollingInterval, isOnline])

  return isServerReachable
}

// Network status component
export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus()
  const isServerReachable = useServerConnectivity()

  if (isOnline && isServerReachable) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
      {!isOnline ? <span>You are offline</span> : <span>Server connection lost</span>}
    </div>
  )
}
