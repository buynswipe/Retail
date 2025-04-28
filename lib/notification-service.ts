import { supabase, createClient } from "./supabase-client"
import type { Notification } from "./types"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

export async function createNotification({
  user_id,
  title,
  message,
  type,
  reference_id,
  message_hindi,
  priority = "medium",
}: {
  user_id: string
  title: string
  message: string
  type: "order" | "payment" | "chat" | "system"
  reference_id?: string
  message_hindi?: string
  priority?: "low" | "medium" | "high"
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient()
    const notification: Partial<Notification> = {
      id: uuidv4(),
      user_id,
      title,
      message,
      type,
      reference_id,
      message_hindi,
      priority,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    const { error } = await client.from("notifications").insert(notification)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getNotifications(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ data: Notification[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return { data: data || [] }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { data: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUnreadNotificationsCount(userId: string): Promise<{ count: number; error?: string }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      throw error
    }

    return { count: count || 0 }
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return { count: 0, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Add this export to match the import name being used elsewhere
export const getUnreadNotificationCount = getUnreadNotificationsCount

// This ensures backward compatibility with code that's importing the function without the 's'

export async function getNotificationPreferences(userId: string): Promise<{ data: any; error?: string }> {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      throw error
    }

    // If no preferences found, return default preferences
    if (!data) {
      return {
        data: {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          sms_notifications: true,
          order_updates: true,
          payment_updates: true,
          chat_messages: true,
          system_updates: true,
        },
      }
    }

    return { data }
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (!existingPrefs) {
      // Insert new preferences
      const { error } = await supabase.from("notification_preferences").insert({
        user_id: userId,
        ...preferences,
      })

      if (error) {
        throw error
      }
    } else {
      // Update existing preferences
      const { error } = await supabase.from("notification_preferences").update(preferences).eq("user_id", userId)

      if (error) {
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Add the missing function (singular form)
export const updateNotificationPreference = updateNotificationPreferences

// Store active channels for later unsubscription
const activeChannels: Map<string, RealtimeChannel> = new Map()

export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  if (typeof window === "undefined") return () => {}

  const client = createClient()
  const channelKey = `user-notifications:${userId}`

  // Clean up any existing subscription for this user
  if (activeChannels.has(channelKey)) {
    unsubscribeFromNotifications(channelKey)
  }

  const channel = client
    .channel(channelKey)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification)
      },
    )
    .subscribe()

  // Store the channel for later unsubscription
  activeChannels.set(channelKey, channel)

  return () => {
    unsubscribeFromNotifications(channelKey)
  }
}

// Add the missing unsubscribeFromNotifications function
export function unsubscribeFromNotifications(channelKey: string): void {
  if (typeof window === "undefined") return

  const channel = activeChannels.get(channelKey)
  if (channel) {
    const client = createClient()
    client.removeChannel(channel)
    activeChannels.delete(channelKey)
  }
}

// Add the missing createDefaultNotificationPreferences function
export async function createDefaultNotificationPreferences(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultPreferences = {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      order_updates: true,
      payment_updates: true,
      chat_messages: true,
      system_updates: true,
      marketing_notifications: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("notification_preferences").insert(defaultPreferences)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating default notification preferences:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
