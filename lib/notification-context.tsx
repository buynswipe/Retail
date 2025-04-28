"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  type Notification,
} from "./notification-service"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const { toast } = useToast()

  // Load notifications and unread count
  const loadNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data } = await getNotifications(user.id)
      if (data) {
        setNotifications(data)
      }

      const { count } = await getUnreadNotificationCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time subscription when user changes
  useEffect(() => {
    if (!user) return

    // Load initial notifications
    loadNotifications()

    // Subscribe to real-time notifications
    const channel = subscribeToNotifications(user.id, (newNotification) => {
      // Add the new notification to the state
      setNotifications((prev) => [newNotification, ...prev])

      // Increment unread count
      setUnreadCount((prev) => prev + 1)

      // Show a toast notification
      toast({
        title: getNotificationTypeTitle(newNotification.type),
        description: newNotification.message,
        variant: getNotificationVariant(newNotification.priority),
      })
    })

    setRealtimeChannel(channel)

    // Clean up subscription on unmount or when user changes
    return () => {
      if (channel) {
        unsubscribeFromNotifications(channel)
      }
    }
  }, [user])

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { success } = await markNotificationAsRead(notificationId)
      if (success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification,
          ),
        )
        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1))
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
        setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
        // Reset unread count
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Delete a notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { success } = await deleteNotification(notificationId)
      if (success) {
        // Update local state
        const deletedNotification = notifications.find((n) => n.id === notificationId)
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))

        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  // Refresh notifications
  const refreshNotifications = async () => {
    await loadNotifications()
  }

  // Helper function to get notification type title
  const getNotificationTypeTitle = (type: string): string => {
    switch (type) {
      case "order":
        return "Order Update"
      case "payment":
        return "Payment Update"
      case "chat":
        return "New Message"
      case "delivery":
        return "Delivery Update"
      case "system":
        return "System Notification"
      default:
        return "Notification"
    }
  }

  // Helper function to get notification variant based on priority
  const getNotificationVariant = (priority: string): "default" | "destructive" => {
    switch (priority) {
      case "high":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification: handleDeleteNotification,
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
