import { createClient } from "./supabase-client"

// Define PaymentStatus type if not already defined in types.ts
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled"

/**
 * Updates the payment status of an order
 * @param orderId The ID of the order to update
 * @param paymentStatus The new payment status
 * @param paymentDetails Optional additional payment details
 * @returns Object with success status and error if any
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentDetails?: Record<string, any>,
): Promise<{ success: boolean; error: any }> {
  try {
    const supabase = createClient()

    // Handle demo order IDs
    if (orderId.startsWith("demo-")) {
      console.log(`Demo order payment status update: ${orderId} -> ${paymentStatus}`)
      return { success: true, error: null }
    }

    const updateData: Record<string, any> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    }

    // Extract transaction ID from payment details if available
    if (paymentDetails?.mihpayid) {
      updateData.transaction_id = paymentDetails.mihpayid
    }

    // Store payment details as JSON
    if (paymentDetails) {
      updateData.payment_details = paymentDetails
    }

    // If payment is completed, update the order status to confirmed
    if (paymentStatus === "completed") {
      updateData.status = "confirmed"
    }

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

    if (error) {
      console.error("Error updating order payment status:", error)
      return { success: false, error }
    }

    // Log the payment status update
    await logPaymentStatusUpdate(orderId, paymentStatus, paymentDetails)

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating order payment status:", error)
    return { success: false, error }
  }
}

/**
 * Logs a payment status update to the payment_logs table
 * @param orderId The ID of the order
 * @param paymentStatus The payment status
 * @param paymentDetails Optional payment details
 */
async function logPaymentStatusUpdate(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentDetails?: Record<string, any>,
): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from("payment_logs").insert({
      order_id: orderId,
      payment_status: paymentStatus,
      transaction_id: paymentDetails?.mihpayid || paymentDetails?.transaction_id,
      payment_details: paymentDetails,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error logging payment status update:", error)
  }
}

/**
 * Gets the payment status of an order
 * @param orderId The ID of the order
 * @returns The payment status and transaction ID
 */
export async function getOrderPaymentStatus(
  orderId: string,
): Promise<{ paymentStatus: PaymentStatus; transactionId?: string; error: any }> {
  try {
    const supabase = createClient()

    // Handle demo order IDs
    if (orderId.startsWith("demo-")) {
      return { paymentStatus: "pending", transactionId: undefined, error: null }
    }

    const { data, error } = await supabase
      .from("orders")
      .select("payment_status, transaction_id")
      .eq("id", orderId)
      .single()

    if (error) {
      console.error("Error getting order payment status:", error)
      return { paymentStatus: "pending", error }
    }

    return {
      paymentStatus: data.payment_status as PaymentStatus,
      transactionId: data.transaction_id,
      error: null,
    }
  } catch (error) {
    console.error("Error getting order payment status:", error)
    return { paymentStatus: "pending", error }
  }
}
