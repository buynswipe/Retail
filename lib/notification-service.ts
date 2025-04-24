import { supabase } from "@/lib/supabase-client"

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
  preferences: any,
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if preferences already exist
    const { data: existingPrefs } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    let error

    if (existingPrefs) {
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

// Get user notifications
export async function getUserNotifications(userId: string): Promise<{ data: any[] | null; error: any }> {
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
