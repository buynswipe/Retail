"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { chatPresenceService } from "./chat-presence-service"

interface ChatPresence {
  userId: string
  username: string
  role: string
  lastActive: string
  status: "online" | "offline" | "away"
  sessionId: string
}

interface ChatPresenceContextType {
  activeUsers: ChatPresence[]
  currentUserSessionId: string | null
}

const ChatPresenceContext = createContext<ChatPresenceContextType>({
  activeUsers: [],
  currentUserSessionId: null,
})

export function ChatPresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeUsers, setActiveUsers] = useState<ChatPresence[]>([])
  const [currentUserSessionId, setCurrentUserSessionId] = useState<string | null>(null)

  // Register user presence when they log in
  useEffect(() => {
    let sessionId: string | null = null
    let heartbeatInterval: NodeJS.Timeout | null = null

    async function registerPresence() {
      if (user && user.id) {
        try {
          // Register the user's presence
          sessionId = await chatPresenceService.registerPresence(
            user.id,
            user.name || user.email || "Unknown User",
            user.role || "unknown",
          )
          setCurrentUserSessionId(sessionId)

          // Set up heartbeat to keep presence active
          heartbeatInterval = setInterval(() => {
            if (user && user.id && sessionId) {
              chatPresenceService.heartbeat(user.id, sessionId).catch(console.error)
            }
          }, 30000) // Every 30 seconds
        } catch (error) {
          console.error("Error registering presence:", error)
        }
      }
    }

    registerPresence()

    // Clean up on unmount
    return () => {
      if (user && user.id && sessionId) {
        chatPresenceService.markOffline(user.id, sessionId).catch(console.error)
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    }
  }, [user])

  // Subscribe to presence changes
  useEffect(() => {
    // Initial fetch of active users
    chatPresenceService.getActiveUsers().then(setActiveUsers).catch(console.error)

    // Subscribe to changes
    const unsubscribe = chatPresenceService.subscribeToPresenceChanges(setActiveUsers)

    return unsubscribe
  }, [])

  // Set up page visibility change handler to update status
  useEffect(() => {
    function handleVisibilityChange() {
      if (user && user.id && currentUserSessionId) {
        const newStatus = document.visibilityState === "visible" ? "online" : "away"
        chatPresenceService.updateStatus(user.id, currentUserSessionId, newStatus).catch(console.error)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user, currentUserSessionId])

  return (
    <ChatPresenceContext.Provider value={{ activeUsers, currentUserSessionId }}>
      {children}
    </ChatPresenceContext.Provider>
  )
}

export function useChatPresence() {
  return useContext(ChatPresenceContext)
}
