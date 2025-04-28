import { supabase } from "./supabase-client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  reference_id?: string
  is_read?: boolean
  message_hindi?: string
  priority: "low" | "medium" | "high"
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  type: "order" | "payment" | "chat" | "system" | "delivery"
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

// Create a notification
export async function createNotification(notificationData: {
  user_id: string
  title: string
  message: string
  type: string
  reference_id?: string
  is_read?: boolean
}): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: notificationData.user_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      reference_id: notificationData.reference_id,
      is_read: notificationData.is_read || false,
    })

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error }
  }
}

// Get notifications for a user
export async function getNotifications(userId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting user notifications:", error)
    return { data: null, error }
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw error
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return { count: 0, error }
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

// Delete notification
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", userId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

// Get notification preferences
export async function getNotificationPreferences(userId: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error, which is fine
      throw error
    }

    // Return default preferences if none exist
    if (!data) {
      return {
        data: {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          order_updates: true,
          payment_updates: true,
          inventory_alerts: true,
          marketing_messages: false,
        },
        error: null,
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting notification preferences:", error)
    return { data: null, error }
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: any,
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if preferences exist
    const { data, error: checkError } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (data) {
      // Update existing preferences
      const { error } = await supabase.from("notification_preferences").update(preferences).eq("user_id", userId)

      if (error) {
        throw error
      }
    } else {
      // Insert new preferences
      const { error } = await supabase.from("notification_preferences").insert({
        user_id: userId,
        ...preferences,
      })

      if (error) {
        throw error
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return { success: false, error }
  }
}

// Update a specific notification preference
export async function updateNotificationPreference(
  userId: string,
  type: string,
  channel: "email" | "push" | "in_app",
  enabled: boolean,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get current preferences
    const { data, error: fetchError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    const channelField = `${channel}_enabled`

    if (data) {
      // Update existing preference
      const { error } = await supabase
        .from("notification_preferences")
        .update({ [channelField]: enabled, updated_at: new Date().toISOString() })
        .eq("id", data.id)

      if (error) throw error
    } else {
      // Create new preference
      const newPreference = {
        user_id: userId,
        type,
        email_enabled: channel === "email" ? enabled : true,
        push_enabled: channel === "push" ? enabled : true,
        in_app_enabled: channel === "in_app" ? enabled : true,
      }

      const { error } = await supabase.from("notification_preferences").insert(newPreference)

      if (error) throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating notification preference:", error)
    return { success: false, error }
  }
}

// Create default notification preferences for a new user
export async function createDefaultNotificationPreferences(userId: string): Promise<{ success: boolean; error: any }> {
  try {
    const defaultPreferences = [
      {
        user_id: userId,
        type: "order",
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
      },
      {
        user_id: userId,
        type: "payment",
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
      },
      {
        user_id: userId,
        type: "chat",
        email_enabled: false,
        push_enabled: true,
        in_app_enabled: true,
      },
      {
        user_id: userId,
        type: "system",
        email_enabled: true,
        push_enabled: false,
        in_app_enabled: true,
      },
      {
        user_id: userId,
        type: "delivery",
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
      },
    ]

    const { error } = await supabase.from("notification_preferences").insert(defaultPreferences)

    return { success: !error, error }
  } catch (error) {
    console.error("Error creating default notification preferences:", error)
    return { success: false, error }
  }
}

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void,
): RealtimeChannel {
  // Subscribe to INSERT events on the notifications table for this user
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Call the callback with the new notification
        onNewNotification(payload.new as Notification)
      },
    )
    .subscribe()

  return channel
}

// Unsubscribe from real-time notifications
export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}
