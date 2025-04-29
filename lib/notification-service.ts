import { supabase } from "./supabase-client"
import type { Notification, NotificationType, NotificationPriority } from "./types"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface NotificationPreference {
  id: string
  user_id: string
  type: NotificationType
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

// Create a notification
export async function createNotification(notification: {
  user_id: string
  type: NotificationType
  message: string
  message_hindi?: string
  priority: NotificationPriority
  related_id?: string
  related_type?: string
}): Promise<{ data: Notification | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        ...notification,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { data: null, error }
  }
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

    if (error) {
      console.error("Error fetching notifications:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { data: null, error }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error }
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
      console.error("Error marking all notifications as read:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("Error deleting notification:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error fetching unread notification count:", error)
      return { count: 0, error }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0, error }
  }
}

// Get notification preferences for a user
export async function getNotificationPreferences(
  userId: string,
): Promise<{ data: NotificationPreference[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error getting notification preferences:", error)
      return { data: null, error }
    }

    return { data, error: null }
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

    if (error) {
      console.error("Error updating notification preference:", error)
      return { success: false, error }
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

    if (error) {
      console.error("Error creating default notification preferences:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating default notification preferences:", error)
    return { success: false, error }
  }
}

// Create order notification
export async function createOrderNotification(
  orderId: string,
  status: string,
  retailerId: string,
  wholesalerId: string,
): Promise<void> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order for notification:", orderError)
      return
    }

    // Create notification for retailer
    let retailerMessage = ""
    let retailerMessageHindi = ""

    switch (status) {
      case "confirmed":
        retailerMessage = `Your order #${order.order_number} has been confirmed by the wholesaler.`
        retailerMessageHindi = `आपका ऑर्डर #${order.order_number} थोक विक्रेता द्वारा पुष्टि कर दिया गया है।`
        break
      case "rejected":
        retailerMessage = `Your order #${order.order_number} has been rejected by the wholesaler.`
        retailerMessageHindi = `आपका ऑर्डर #${order.order_number} थोक विक्रेता द्वारा अस्वीकार कर दिया गया है।`
        break
      case "dispatched":
        retailerMessage = `Your order #${order.order_number} has been dispatched and is on the way.`
        retailerMessageHindi = `आपका ऑर्डर #${order.order_number} भेज दिया गया है और रास्ते में है।`
        break
      case "delivered":
        retailerMessage = `Your order #${order.order_number} has been delivered successfully.`
        retailerMessageHindi = `आपका ऑर्डर #${order.order_number} सफलतापूर्वक वितरित कर दिया गया है।`
        break
      default:
        retailerMessage = `Your order #${order.order_number} status has been updated to ${status}.`
        retailerMessageHindi = `आपके ऑर्डर #${order.order_number} की स्थिति अपडेट करके ${status} कर दी गई है।`
    }

    await createNotification({
      user_id: retailerId,
      type: "order",
      message: retailerMessage,
      message_hindi: retailerMessageHindi,
      priority: "medium",
      related_id: orderId,
      related_type: "order",
    })

    // Create notification for wholesaler if order is placed
    if (status === "placed") {
      const wholesalerMessage = `New order #${order.order_number} has been placed.`
      const wholesalerMessageHindi = `नया ऑर्डर #${order.order_number} प्लेस किया गया है।`

      await createNotification({
        user_id: wholesalerId,
        type: "order",
        message: wholesalerMessage,
        message_hindi: wholesalerMessageHindi,
        priority: "high",
        related_id: orderId,
        related_type: "order",
      })
    }
  } catch (error) {
    console.error("Error creating order notification:", error)
  }
}

// Create payment notification
export async function createPaymentNotification(orderId: string, paymentStatus: string, userId: string): Promise<void> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order for payment notification:", orderError)
      return
    }

    let message = ""
    let messageHindi = ""

    if (paymentStatus === "completed") {
      message = `Payment for order #${order.order_number} has been completed successfully.`
      messageHindi = `ऑर्डर #${order.order_number} के लिए भुगतान सफलतापूर्वक पूरा हो गया है।`
    } else if (paymentStatus === "failed") {
      message = `Payment for order #${order.order_number} has failed. Please try again.`
      messageHindi = `ऑर्डर #${order.order_number} के लिए भुगतान विफल हो गया है। कृपया पुनः प्रयास करें।`
    } else {
      message = `Payment status for order #${order.order_number} has been updated to ${paymentStatus}.`
      messageHindi = `ऑर्डर #${order.order_number} के लिए भुगतान की स्थिति अपडेट करके ${paymentStatus} कर दी गई है।`
    }

    await createNotification({
      user_id: userId,
      type: "payment",
      message,
      message_hindi: messageHindi,
      priority: paymentStatus === "failed" ? "high" : "medium",
      related_id: orderId,
      related_type: "order",
    })
  } catch (error) {
    console.error("Error creating payment notification:", error)
  }
}

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: any) => void,
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
        onNewNotification(payload.new)
      },
    )
    .subscribe()

  return channel
}

// Unsubscribe from real-time notifications
export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}
