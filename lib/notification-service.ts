import { supabase } from "./supabase-client"
import type { Notification } from "./supabase-client"

// Get notifications for a user
export async function getUserNotifications(userId: string): Promise<{ data: Notification[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { data: null, error }
  }
}

// Get unread notifications count
export async function getUnreadNotificationsCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { count: count || 0, error }
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return { count: 0, error }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    return { success: !error, error }
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

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

// Create a notification
export async function createNotification(
  userId: string,
  type: "order" | "payment" | "chat" | "system",
  message: string,
  messageHindi?: string,
  priority: "low" | "medium" | "high" = "medium",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      message,
      message_hindi: messageHindi,
      priority,
      is_read: false,
    })

    return { success: !error, error }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error }
  }
}

// Get notification preferences for a user
export async function getNotificationPreferences(userId: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting notification preferences:", error)
    return { data: null, error }
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    email_enabled?: boolean
    push_enabled?: boolean
    sms_enabled?: boolean
    order_updates?: boolean
    payment_updates?: boolean
    promotional?: boolean
  },
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if preferences exist
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    let error

    if (existing) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from("notification_preferences")
        .update(preferences)
        .eq("user_id", userId)

      error = updateError
    } else {
      // Create new preferences
      const { error: insertError } = await supabase.from("notification_preferences").insert({
        user_id: userId,
        ...preferences,
      })

      error = insertError
    }

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
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
