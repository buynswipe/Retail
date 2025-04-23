import { supabase, supabaseAdmin, type Notification } from "./supabase-client"

// Get notifications for a user
export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching notifications:", error)
    throw new Error("Failed to fetch notifications")
  }

  return data as Notification[]
}

// Get unread notifications count
export async function getUnreadNotificationsCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error fetching unread notifications count:", error)
    throw new Error("Failed to fetch unread notifications count")
  }

  return count || 0
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    throw new Error("Failed to mark notification as read")
  }

  return { success: true }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    throw new Error("Failed to mark all notifications as read")
  }

  return { success: true }
}

// Create a new notification
export async function createNotification(notification: Omit<Notification, "id" | "created_at">) {
  const { error } = await supabaseAdmin.from("notifications").insert(notification)

  if (error) {
    console.error("Error creating notification:", error)
    throw new Error("Failed to create notification")
  }

  return { success: true }
}

// Get notification preferences for a user
export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error, which is fine - user hasn't set preferences yet
    console.error("Error fetching notification preferences:", error)
    throw new Error("Failed to fetch notification preferences")
  }

  return (
    data || {
      user_id: userId,
      order_updates: true,
      payment_updates: true,
      chat_messages: true,
      marketing: false,
      email_notifications: true,
      sms_notifications: true,
      push_notifications: false,
    }
  )
}

// Update notification preferences for a user
export async function updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
  const { data: existing } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

  if (existing) {
    const { error } = await supabase.from("notification_preferences").update(preferences).eq("user_id", userId)

    if (error) {
      console.error("Error updating notification preferences:", error)
      throw new Error("Failed to update notification preferences")
    }
  } else {
    const { error } = await supabase.from("notification_preferences").insert({
      user_id: userId,
      ...preferences,
    })

    if (error) {
      console.error("Error creating notification preferences:", error)
      throw new Error("Failed to create notification preferences")
    }
  }

  return { success: true }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    console.error("Error deleting notification:", error)
    throw new Error("Failed to delete notification")
  }

  return { success: true }
}
