"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification-service"
import { useAuth } from "./auth-context"
import type { Notification } from "./supabase-client"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user])

  // Refresh notifications
  const refreshNotifications = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Get notifications
      const { data } = await getUserNotifications(user.id)
      if (data) {
        setNotifications(data)
      }

      // Get unread count
      const { count } = await getUnreadNotificationsCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error refreshing notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { success } = await markNotificationAsRead(notificationId)

      if (success) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification,
          ),
        )

        // Update unread count
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { success } = await markAllNotificationsAsRead(user.id)

      if (success) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({ ...notification, is_read: true })),
        )

        // Update unread count
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
