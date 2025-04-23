import { supabase } from "./supabase-client"

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
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
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    return count || 0
  } catch (error) {
    console.error("Error counting unread notifications:", error)
    return 0
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

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

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  messageHindi?: string,
  priority = "medium",
) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        message,
        message_hindi: messageHindi,
        priority,
        is_read: false,
      })
      .select()

    return { data, error }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { data: null, error }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

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
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return {
      data: data || {
        user_id: userId,
        order_updates: true,
        payment_updates: true,
        chat_messages: true,
        promotional: false,
        email_notifications: false,
        sms_notifications: true,
        push_notifications: false,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return {
      data: {
        user_id: userId,
        order_updates: true,
        payment_updates: true,
        chat_messages: true,
        promotional: false,
        email_notifications: false,
        sms_notifications: true,
        push_notifications: false,
      },
      error,
    }
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
  try {
    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    let result

    if (existingPrefs) {
      // Update existing preferences
      result = await supabase.from("notification_preferences").update(preferences).eq("user_id", userId)
    } else {
      // Create new preferences
      result = await supabase.from("notification_preferences").insert({
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
