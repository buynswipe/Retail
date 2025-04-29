"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "./supabase-client"

type UserFlowEvent = {
  id: string
  sessionId: string
  userId?: string
  fromPage: string
  toPage: string
  timestamp: string
  duration?: number
  eventType: "navigation" | "interaction" | "conversion"
  metadata?: Record<string, any>
}

type UserFlowContextType = {
  trackEvent: (eventType: "navigation" | "interaction" | "conversion", metadata?: Record<string, any>) => void
  trackInteraction: (element: string, action: string, metadata?: Record<string, any>) => void
  trackConversion: (conversionType: string, value?: number, metadata?: Record<string, any>) => void
  sessionId: string
}

const UserFlowContext = createContext<UserFlowContextType | null>(null)

export function UserFlowProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string>("")
  const [lastPage, setLastPage] = useState<string>("")
  const [lastTimestamp, setLastTimestamp] = useState<Date | null>(null)

  // Initialize session ID on mount
  useEffect(() => {
    // Try to get existing session ID from localStorage
    let existingSessionId = localStorage.getItem("user_flow_session_id")

    // If no session ID exists or it's older than 30 minutes, create a new one
    const sessionTimestamp = localStorage.getItem("user_flow_session_timestamp")
    const isSessionExpired = sessionTimestamp && Date.now() - new Date(sessionTimestamp).getTime() > 30 * 60 * 1000

    if (!existingSessionId || isSessionExpired) {
      existingSessionId = uuidv4()
      localStorage.setItem("user_flow_session_id", existingSessionId)
    }

    // Update session timestamp
    localStorage.setItem("user_flow_session_timestamp", new Date().toISOString())
    setSessionId(existingSessionId)

    // Set initial page
    setLastPage(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""))
    setLastTimestamp(new Date())

    // Clean up function
    return () => {
      // Update session timestamp on unmount
      localStorage.setItem("user_flow_session_timestamp", new Date().toISOString())
    }
  }, [])

  // Track page changes
  useEffect(() => {
    if (!sessionId || !lastPage) return

    const currentPage = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

    // Don't track if it's the same page (e.g., search param changes)
    if (lastPage === currentPage) return

    const now = new Date()
    const duration = lastTimestamp ? now.getTime() - lastTimestamp.getTime() : undefined

    // Track page navigation
    trackEvent("navigation", {
      fromPage: lastPage,
      toPage: currentPage,
      duration,
    })

    // Update last page and timestamp
    setLastPage(currentPage)
    setLastTimestamp(now)
  }, [pathname, searchParams, sessionId])

  // Function to track events
  const trackEvent = async (eventType: "navigation" | "interaction" | "conversion", metadata?: Record<string, any>) => {
    if (!sessionId) return

    const userId = localStorage.getItem("user_id") || undefined
    const currentPage = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

    const event: UserFlowEvent = {
      id: uuidv4(),
      sessionId,
      userId,
      fromPage: lastPage,
      toPage: currentPage,
      timestamp: new Date().toISOString(),
      eventType,
      metadata,
    }

    try {
      // Try to send to Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await supabase.from("user_flow_events").insert([event])
      } else {
        // For development/testing
        console.log("User flow event tracked:", event)
      }
    } catch (error) {
      console.error("Failed to track user flow event:", error)

      // Store failed events in localStorage for later retry
      const failedEvents = JSON.parse(localStorage.getItem("failed_user_flow_events") || "[]")
      failedEvents.push(event)
      localStorage.setItem("failed_user_flow_events", JSON.stringify(failedEvents))
    }
  }

  // Helper function to track user interactions
  const trackInteraction = (element: string, action: string, metadata?: Record<string, any>) => {
    trackEvent("interaction", {
      element,
      action,
      ...metadata,
    })
  }

  // Helper function to track conversions
  const trackConversion = (conversionType: string, value?: number, metadata?: Record<string, any>) => {
    trackEvent("conversion", {
      conversionType,
      value,
      ...metadata,
    })
  }

  // Retry sending failed events
  useEffect(() => {
    const retrySendingFailedEvents = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

      const failedEvents = JSON.parse(localStorage.getItem("failed_user_flow_events") || "[]")
      if (failedEvents.length === 0) return

      try {
        await supabase.from("user_flow_events").insert(failedEvents)
        localStorage.removeItem("failed_user_flow_events")
      } catch (error) {
        console.error("Failed to retry sending events:", error)
      }
    }

    // Try to send failed events when online
    if (navigator.onLine) {
      retrySendingFailedEvents()
    }

    // Listen for online event to retry
    window.addEventListener("online", retrySendingFailedEvents)
    return () => {
      window.removeEventListener("online", retrySendingFailedEvents)
    }
  }, [sessionId])

  return (
    <UserFlowContext.Provider value={{ trackEvent, trackInteraction, trackConversion, sessionId }}>
      {children}
    </UserFlowContext.Provider>
  )
}

export function useUserFlow() {
  const context = useContext(UserFlowContext)
  if (!context) {
    throw new Error("useUserFlow must be used within a UserFlowProvider")
  }
  return context
}
