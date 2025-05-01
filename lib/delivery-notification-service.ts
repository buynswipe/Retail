import { errorHandler } from "@/lib/error-handler"
import type { DeliveryAssignment } from "@/lib/types"

// Send delivery notification
export async function sendDeliveryNotification(
  deliveryId: string,
  status: string,
  message: string,
  recipientId: string,
  recipientRole: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const response = await fetch("/api/delivery/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deliveryId,
        status,
        message,
        recipientId,
        recipientRole,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send delivery notification")
    }

    const data = await response.json()
    return { success: true, error: null }
  } catch (error) {
    errorHandler(error, "Error sending delivery notification")
    return { success: false, error }
  }
}

// Get delivery notifications for a user
export async function getDeliveryNotifications(userId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const response = await fetch(`/api/delivery/notifications?userId=${userId}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch delivery notifications")
    }

    const data = await response.json()
    return { data: data.notifications, error: null }
  } catch (error) {
    errorHandler(error, "Error fetching delivery notifications")
    return { data: null, error }
  }
}

// Send notification when delivery status changes
export async function notifyDeliveryStatusChange(
  delivery: DeliveryAssignment,
): Promise<{ success: boolean; error: any }> {
  try {
    // Determine recipients and messages based on status
    const notifications = []

    // Always notify the retailer
    if (delivery.order?.retailer_id) {
      let message = ""

      switch (delivery.status) {
        case "accepted":
          message = `Your order #${delivery.order.order_number} is now in transit. A delivery partner has been assigned.`
          break
        case "completed":
          message = `Your order #${delivery.order.order_number} has been delivered successfully.`
          break
        case "declined":
          message = `There was an issue with the delivery assignment for your order #${delivery.order.order_number}. We're working to reassign it.`
          break
        default:
          message = `There's an update to your order #${delivery.order.order_number}.`
      }

      notifications.push({
        recipientId: delivery.order.retailer_id,
        recipientRole: "retailer",
        message,
      })
    }

    // Notify the wholesaler for certain statuses
    if (delivery.order?.wholesaler_id && (delivery.status === "accepted" || delivery.status === "completed")) {
      const message =
        delivery.status === "accepted"
          ? `Order #${delivery.order.order_number} is now in transit to the retailer.`
          : `Order #${delivery.order.order_number} has been delivered successfully to the retailer.`

      notifications.push({
        recipientId: delivery.order.wholesaler_id,
        recipientRole: "wholesaler",
        message,
      })
    }

    // Notify admin for declined deliveries
    if (delivery.status === "declined") {
      // Get admin users
      const { data: admins } = await fetch("/api/users?role=admin").then((res) => res.json())

      if (admins && admins.length > 0) {
        const message = `Delivery partner declined assignment for order #${delivery.order?.order_number}. Please reassign.`

        // Notify the first admin (or you could notify all)
        notifications.push({
          recipientId: admins[0].id,
          recipientRole: "admin",
          message,
        })
      }
    }

    // Send all notifications
    const results = await Promise.all(
      notifications.map((notification) =>
        sendDeliveryNotification(
          delivery.id,
          delivery.status,
          notification.message,
          notification.recipientId,
          notification.recipientRole,
        ),
      ),
    )

    // Check if all notifications were sent successfully
    const allSuccessful = results.every((result) => result.success)

    return {
      success: allSuccessful,
      error: allSuccessful ? null : "Some notifications failed to send",
    }
  } catch (error) {
    errorHandler(error, "Error notifying about delivery status change")
    return { success: false, error }
  }
}

export default {
  sendDeliveryNotification,
  getDeliveryNotifications,
  notifyDeliveryStatusChange,
}
