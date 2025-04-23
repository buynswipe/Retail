"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../lib/supabase-client"
import { useAuth } from "./AuthContext"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "order" | "payment" | "delivery" | "chat" | "system"
  reference_id?: string
  is_read: boolean
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        })
      }

      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        console.log("Notification permissions not granted")
      }
    }

    requestPermissions()
  }, [])

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications()
      setupRealtimeSubscription()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }

    return () => {
      // Clean up subscription
      if (supabase) {
        supabase.removeAllChannels()
      }
    }
  }, [user])

  // Set up push notification handler
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      // Handle received notification
      refreshNotifications()
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // In a real app, this would fetch notifications from Supabase
      // For demo, we'll use mock data from AsyncStorage
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user.id}`)

      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications) as Notification[]
        setNotifications(parsedNotifications)
        setUnreadCount(parsedNotifications.filter((n) => !n.is_read).length)
      } else {
        // Create some mock notifications if none exist
        const mockNotifications: Notification[] = [
          {
            id: "1",
            user_id: user.id,
            title: "Welcome to RetailBandhu",
            message: "Thank you for joining RetailBandhu. Start exploring the app now!",
            type: "system",
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: user.id,
            title: "Complete Your Profile",
            message: "Please complete your profile to get the most out of RetailBandhu.",
            type: "system",
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ]

        await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(mockNotifications))
        setNotifications(mockNotifications)
        setUnreadCount(mockNotifications.length)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user || !supabase) return

    // In a real app, this would set up a Supabase realtime subscription
    // For demo, we'll just refresh notifications periodically
    const interval = setInterval(() => {
      // This would be triggered by realtime events in a real app
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }

  const markAsRead = async (id: string) => {
    if (!user) return

    try {
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, is_read: true } : notification,
      )

      await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications))
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        is_read: true,
      }))

      await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications))
      setNotifications(updatedNotifications)
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!user) return

    try {
      const updatedNotifications = notifications.filter((notification) => notification.id !== id)

      await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications))
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
