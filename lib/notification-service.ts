import { supabase } from "./supabase-client"
import type { Notification } from "./supabase-client"

// Get all notifications for a user
export async function getNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Notification[]
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Get notifications for a user (named export required by the application)
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user notifications:", error)
      return { data: null, error }
    }

    return { data: data as Notification[], error: null }
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return { data: null, error }
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

    if (error) throw error
    return data?.[0] as Notification | undefined
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return undefined
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select()

    if (error) throw error
    return data as Notification[]
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return []
  }
}

// Create a new notification
export async function createNotification(notification: Omit<Notification, "id" | "created_at">) {
  try {
    const { data, error } = await supabase.from("notifications").insert([notification]).select()

    if (error) throw error
    return data?.[0] as Notification | undefined
  } catch (error) {
    console.error("Error creating notification:", error)
    return undefined
  }
}

// Get notification preferences for a user
export async function getNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 is "no rows returned"

    return (
      data || {
        user_id: userId,
        order_updates: true,
        payment_updates: true,
        chat_messages: true,
        promotional: false,
        email_notifications: false,
        sms_notifications: true,
        push_notifications: false,
      }
    )
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return {
      user_id: userId,
      order_updates: true,
      payment_updates: true,
      chat_messages: true,
      promotional: false,
      email_notifications: false,
      sms_notifications: true,
      push_notifications: false,
    }
  }
}

// Update notification preferences for a user
export async function updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
  try {
    // Check if preferences exist
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from("notification_preferences")
        .update(preferences)
        .eq("user_id", userId)
        .select()

      if (error) throw error
      return data?.[0]
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from("notification_preferences")
        .insert([{ user_id: userId, ...preferences }])
        .select()

      if (error) throw error
      return data?.[0]
    }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return null
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    return false
  }
}

// Get unread notifications count for a user
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("Error counting unread notifications:", error)
    return 0
  }
}
