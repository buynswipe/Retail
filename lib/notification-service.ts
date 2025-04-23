import { supabase } from "./supabase-client"
import type { Notification } from "./supabase-client"

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("Notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return { data: null, error }
  }
}

/**
 * Get notifications for a user (alias for getUserNotifications)
 */
export async function getNotifications(userId: string) {
  return getUserNotifications(userId)
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("Notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { count: count || 0, error }
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0, error }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase.from("Notifications").update({ is_read: true }).eq("id", notificationId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from("Notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase.from("Notifications").delete().eq("id", notificationId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase.from("NotificationPreferences").select("*").eq("user_id", userId).single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return { data: null, error }
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
  try {
    // Check if preferences exist
    const { data: existingPrefs } = await getNotificationPreferences(userId)

    let result

    if (existingPrefs) {
      // Update existing preferences
      result = await supabase.from("NotificationPreferences").update(preferences).eq("user_id", userId)
    } else {
      // Create new preferences
      result = await supabase.from("NotificationPreferences").insert({
        user_id: userId,
        ...preferences,
      })
    }

    return { success: !result.error, error: result.error }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return { success: false, error }
  }
}

/**
 * Create a new notification
 */
export async function createNotification(notification: Omit<Notification, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from("Notifications")
      .insert({
        ...notification,
        is_read: false,
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { data: null, error }
  }
}
