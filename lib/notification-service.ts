import { supabase } from "./supabase-client"
import type { Notification } from "./supabase-client"

// Get notifications for a specific user
export async function getNotificationsByUserId(userId: string) {
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

// Get unread notification count for a specific user
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { count: data?.length || 0, error }
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return { count: 0, error }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()

    return { success: !error, data, error }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, data: null, error }
  }
}

// Mark all notifications as read for a specific user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select()

    return { success: !error, data, error }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, data: null, error }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

// Create a notification
export async function createNotification(notification: Omit<Notification, "id" | "created_at">) {
  try {
    const { data, error } = await supabase.from("notifications").insert(notification).select()

    return { success: !error, data, error }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, data: null, error }
  }
}

// Subscribe to notifications for a specific user
export function subscribeToUserNotifications(userId: string, callback: (notification: any) => void) {
  return supabase
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
        callback(payload.new)
      },
    )
    .subscribe()
}

// Get notification preferences for a specific user
export async function getNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting notification preferences:", error)
    return { data: null, error }
  }
}

// Update notification preferences for a specific user
export async function updateNotificationPreferences(userId: string, preferences: any) {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...preferences })
      .select()

    return { success: !error, data, error }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return { success: false, data: null, error }
  }
}
