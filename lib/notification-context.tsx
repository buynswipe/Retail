"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  error: Error | null
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
  const [error, setError] = useState<Error | null>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const { toast } = useToast()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Load notifications and unread count with retry mechanism
  const loadNotifications = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get notifications
      const { data, error: notificationError } = await getNotifications(user.id)

      if (notificationError) {
        console.error("Error loading notifications:", notificationError)
        setError(notificationError instanceof Error ? notificationError : new Error(String(notificationError)))

        // Retry logic for network errors
        if (
          retryCount < maxRetries &&
          (notificationError.message?.includes("Failed to fetch") || notificationError.message?.includes("timeout"))
        ) {
          setRetryCount((prev) => prev + 1)
          setTimeout(() => loadNotifications(), 2000 * Math.pow(2, retryCount)) // Exponential backoff
          return
        }
      } else {
        // Reset retry count on success
        setRetryCount(0)
        setNotifications(data || [])
      }

      // Get unread count - continue even if notifications failed
      const { count, error: countError } = await getUnreadNotificationCount(user.id)

      if (countError) {
        console.error("Error loading unread count:", countError)
      } else {
        setUnreadCount(count)
      }
    } catch (err) {
      console.error("Unexpected error in loadNotifications:", err)
      setError(err instanceof Error ? err : new Error(String(err)))

      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1)
        setTimeout(() => loadNotifications(), 2000 * Math.pow(2, retryCount))
      }
    } finally {
      setLoading(false)
    }
  }, [user, retryCount, maxRetries])

  // Set up real-time subscription when user changes
  useEffect(() => {
    if (!user) return

    // Load initial notifications
    loadNotifications()

    // Clean up function to handle unsubscription
    let channel: RealtimeChannel | null = null

    // Subscribe to real-time notifications
    try {
      channel = subscribeToNotifications(user.id, (newNotification) => {
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
    } catch (err) {
      console.error("Error setting up notification subscription:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }

    // Clean up subscription on unmount or when user changes
    return () => {
      if (channel) {
        try {
          unsubscribeFromNotifications(channel)
        } catch (err) {
          console.error("Error unsubscribing from notifications:", err)
        }
      }
    }
  }, [user, toast, loadNotifications])

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
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive",
      })
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

        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read. Please try again.",
        variant: "destructive",
      })
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

        toast({
          title: "Success",
          description: "Notification deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Refresh notifications
  const refreshNotifications = async () => {
    setRetryCount(0) // Reset retry count on manual refresh
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
        error,
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
