"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import {
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToUserNotifications,
} from "./notification-service"
import type { Notification } from "./supabase-client"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()

      // Subscribe to real-time notifications
      const subscription = subscribeToUserNotifications(user.id, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // Show browser notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("RetailBandhu", {
            body: newNotification.message,
            icon: "/logo.png",
          })
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getNotificationsByUserId(user.id)
      if (error) {
        console.error("Error loading notifications:", error)
      } else if (data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const { count, error } = await getUnreadNotificationCount(user.id)
      if (error) {
        console.error("Error loading unread count:", error)
      } else {
        setUnreadCount(count)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { success } = await markNotificationAsRead(notificationId)
      if (success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { success } = await markAllNotificationsAsRead(user.id)
      if (success) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
    await loadUnreadCount()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
