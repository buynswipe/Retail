import { supabase } from "./supabase-client"
import type { Payment } from "./supabase-client"

/**
 * Create a new payment
 */
export async function createPayment(payment: Omit<Payment, "id" | "created_at" | "reference_id">) {
  try {
    // Generate a unique reference ID
    const referenceId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const { data, error } = await supabase
      .from("Payments")
      .insert({
        ...payment,
        reference_id: referenceId,
        status: payment.status || "pending",
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { data: null, error }
  }
}

/**
 * Get a payment by ID
 */
export async function getPaymentById(paymentId: string) {
  try {
    const { data, error } = await supabase.from("Payments").select("*").eq("id", paymentId).single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching payment:", error)
    return { data: null, error }
  }
}

/**
 * Get payments by user ID
 */
export async function getPaymentsByUserId(userId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Payments")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching user payments:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId: string, status: string) {
  try {
    const { data, error } = await supabase.from("Payments").update({ status }).eq("id", paymentId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { data: null, error }
  }
}

/**
 * Verify UPI payment
 */
export async function verifyUpiPayment(referenceId: string, transactionId: string) {
  try {
    // In a real implementation, this would call a payment gateway API
    // For now, we'll simulate a successful verification

    const { data, error } = await supabase
      .from("Payments")
      .update({
        status: "completed",
        transaction_id: transactionId,
        verified_at: new Date().toISOString(),
      })
      .eq("reference_id", referenceId)
      .select()
      .single()

    return {
      data,
      error,
      verified: !error && data?.status === "completed",
    }
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return { data: null, error, verified: false }
  }
}

/**
 * Record COD payment collection
 */
export async function recordCodCollection(paymentId: string, collectedBy: string) {
  try {
    const { data, error } = await supabase
      .from("Payments")
      .update({
        status: "completed",
        collected_by: collectedBy,
        collected_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("payment_method", "cod")
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error recording COD collection:", error)
    return { data: null, error }
  }
}

/**
 * Alias for recordCodCollection
 */
export async function markCodPaymentCollected(paymentId: string, collectedBy: string) {
  return recordCodCollection(paymentId, collectedBy)
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(userId: string) {
  try {
    // Get total payments
    const { count: totalCount } = await supabase
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get completed payments
    const { count: completedCount } = await supabase
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")

    // Get pending payments
    const { count: pendingCount } = await supabase
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")

    // Get total amount
    const { data: totalAmountData } = await supabase.rpc("get_total_payments_amount", {
      user_id_param: userId,
    })

    const totalAmount = totalAmountData || 0

    return {
      totalCount: totalCount || 0,
      completedCount: completedCount || 0,
      pendingCount: pendingCount || 0,
      totalAmount,
    }
  } catch (error) {
    console.error("Error fetching payment statistics:", error)
    return {
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      totalAmount: 0,
    }
  }
}
