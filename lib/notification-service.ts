import { supabase } from "./supabase-client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Notification {
  id: string
  user_id: string
  type: "order" | "payment" | "chat" | "system" | "delivery"
  message: string
  message_hindi?: string
  priority: "low" | "medium" | "high"
  is_read: boolean
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

// Get notifications for a user
export async function getNotifications(userId: string): Promise<{ data: Notification[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    return { data, error }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { data: null, error }
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { count: count || 0, error }
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return { count: 0, error }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error }
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

// Get notification preferences for a user
export async function getNotificationPreferences(
  userId: string,
): Promise<{ data: NotificationPreference[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId)

    return { data, error }
  } catch (error) {
    console.error("Error getting notification preferences:", error)
    return { data: null, error }
  }
}

// Update notification preferences for a user
export async function updateNotificationPreference(
  preferenceId: string,
  updates: {
    email_enabled?: boolean
    push_enabled?: boolean
    in_app_enabled?: boolean
  },
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("notification_preferences")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", preferenceId)

    return { success: !error, error }
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
