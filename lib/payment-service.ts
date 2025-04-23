import { supabase } from "./supabase-client"
import type { Payment } from "./supabase-client"

// Generate a unique reference ID
function generateReferenceId(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `PAY-${timestamp}-${random}`
}

// Create a new payment
export async function createPayment(
  orderId: string,
  amount: number,
  paymentMethod: "cod" | "upi",
  upiId?: string,
): Promise<{ data: Payment | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        amount,
        payment_method: paymentMethod,
        payment_status: "pending",
        reference_id: generateReferenceId(),
        upi_id: upiId,
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { data: null, error }
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string): Promise<{ data: Payment | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting payment:", error)
    return { data: null, error }
  }
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: string,
  status: "completed" | "failed",
  transactionId?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const updates: any = {
      payment_status: status,
      payment_date: new Date().toISOString(),
    }

    if (transactionId) {
      updates.transaction_id = transactionId
    }

    const { error } = await supabase.from("payments").update(updates).eq("id", paymentId)

    if (!error && status === "completed") {
      // Get order ID
      const { data: payment } = await supabase.from("payments").select("order_id").eq("id", paymentId).single()

      if (payment) {
        // Update order payment status
        await supabase.from("orders").update({ payment_status: "completed" }).eq("id", payment.order_id)
      }
    }

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Record COD payment collection
export async function recordCodCollection(
  paymentId: string,
  collectedById: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        collected_by: collectedById,
      })
      .eq("id", paymentId)

    if (!error) {
      // Get order ID
      const { data: payment } = await supabase.from("payments").select("order_id").eq("id", paymentId).single()

      if (payment) {
        // Update order payment status
        await supabase.from("orders").update({ payment_status: "completed" }).eq("id", payment.order_id)
      }
    }

    return { success: !error, error }
  } catch (error) {
    console.error("Error recording COD collection:", error)
    return { success: false, error }
  }
}

// Get payments by retailer ID
export async function getRetailerPayments(retailerId: string): Promise<{ data: Payment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, orders!inner(*)")
      .eq("orders.retailer_id", retailerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting retailer payments:", error)
    return { data: null, error }
  }
}

// Get payments by wholesaler ID
export async function getWholesalerPayments(wholesalerId: string): Promise<{ data: Payment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, orders!inner(*)")
      .eq("orders.wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting wholesaler payments:", error)
    return { data: null, error }
  }
}

// Mark COD payment as collected (alias for recordCodCollection for compatibility)
export async function markCodPaymentCollected(
  paymentId: string,
  collectedById: string,
): Promise<{ success: boolean; error: any }> {
  return recordCodCollection(paymentId, collectedById)
}

// Verify UPI payment
export async function verifyUpiPayment(
  paymentId: string,
  transactionId: string,
  amount: number,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("amount, payment_status")
      .eq("id", paymentId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError }
    }

    // Verify amount
    if (payment.amount !== amount) {
      return { success: false, error: "Payment amount mismatch" }
    }

    // Check if already processed
    if (payment.payment_status === "completed") {
      return { success: true, error: null }
    }

    // Update payment status
    return updatePaymentStatus(paymentId, "completed", transactionId)
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return { success: false, error }
  }
}

// Get payments by user ID
export async function getPaymentsByUserId(userId: string): Promise<{ data: Payment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, orders!inner(*)")
      .or(`orders.retailer_id.eq.${userId},orders.wholesaler_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting payments by user ID:", error)
    return { data: null, error }
  }
}

// Get payment statistics
export async function getPaymentStatistics(
  userId: string,
  userType: "retailer" | "wholesaler",
): Promise<{ data: any | null; error: any }> {
  try {
    const userIdField = userType === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get total payments
    const { data: totalData, error: totalError } = await supabase
      .from("payments")
      .select("amount, payment_status, orders!inner(*)")
      .eq(`orders.${userIdField}`, userId)

    if (totalError) {
      return { data: null, error: totalError }
    }

    // Calculate statistics
    const total = totalData.length
    const completed = totalData.filter((p) => p.payment_status === "completed").length
    const pending = totalData.filter((p) => p.payment_status === "pending").length
    const totalAmount = totalData.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = totalData.filter((p) => p.payment_status === "completed").reduce((sum, p) => sum + p.amount, 0)

    return {
      data: {
        total,
        completed,
        pending,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting payment statistics:", error)
    return { data: null, error }
  }
}
