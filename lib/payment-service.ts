import { supabase, supabaseAdmin, type Payment } from "./supabase-client"

// Create a new payment
export async function createPayment(orderId: string, amount: number, paymentMethod: "cod" | "upi", upiId?: string) {
  const referenceId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`

  const { data, error } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      amount,
      payment_method: paymentMethod,
      payment_status: "pending",
      reference_id: referenceId,
      upi_id: upiId,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating payment:", error)
    throw new Error("Failed to create payment")
  }

  return data
}

// Get all payments
export async function getAllPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*, orders(*)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
    throw new Error("Failed to fetch payments")
  }

  return data
}

// Get payments by user ID (works for retailers, wholesalers, etc.)
export async function getPaymentsByUserId(userId: string, userRole: string) {
  let query = supabase.from("payments").select("*, orders!inner(*)")

  if (userRole === "retailer") {
    query = query.eq("orders.retailer_id", userId)
  } else if (userRole === "wholesaler") {
    query = query.eq("orders.wholesaler_id", userId)
  } else if (userRole === "delivery") {
    // For delivery partners, we need to join with delivery_assignments
    return getPaymentsByDeliveryPartnerId(userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
    throw new Error("Failed to fetch payments")
  }

  return data
}

// Get payments for a delivery partner
async function getPaymentsByDeliveryPartnerId(deliveryPartnerId: string) {
  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders!inner(*), payments!inner(*)")
    .eq("delivery_partner_id", deliveryPartnerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching delivery payments:", error)
    throw new Error("Failed to fetch delivery payments")
  }

  return data.map((item) => ({
    ...item.payments,
    orders: item.orders,
  }))
}

// Get payment statistics for a user
export async function getPaymentStatistics(userId: string, userRole: string) {
  let totalQuery, pendingQuery, completedQuery

  if (userRole === "retailer") {
    totalQuery = supabase.from("orders").select("total_amount").eq("retailer_id", userId).eq("status", "delivered")

    pendingQuery = supabase
      .from("payments")
      .select("amount")
      .eq("payment_status", "pending")
      .eq("orders.retailer_id", userId)
      .not("orders.status", "eq", "rejected")

    completedQuery = supabase
      .from("payments")
      .select("amount")
      .eq("payment_status", "completed")
      .eq("orders.retailer_id", userId)
  } else if (userRole === "wholesaler") {
    totalQuery = supabase
      .from("orders")
      .select("wholesaler_payout")
      .eq("wholesaler_id", userId)
      .eq("status", "delivered")

    pendingQuery = supabase
      .from("orders")
      .select("wholesaler_payout")
      .eq("wholesaler_id", userId)
      .eq("status", "delivered")
      .eq("payments.payment_status", "pending")

    completedQuery = supabase
      .from("orders")
      .select("wholesaler_payout")
      .eq("wholesaler_id", userId)
      .eq("status", "delivered")
      .eq("payments.payment_status", "completed")
  } else if (userRole === "delivery") {
    totalQuery = supabase
      .from("delivery_assignments")
      .select("delivery_charge, delivery_charge_gst")
      .eq("delivery_partner_id", userId)
      .eq("status", "completed")

    pendingQuery = supabase
      .from("delivery_assignments")
      .select("delivery_charge, delivery_charge_gst")
      .eq("delivery_partner_id", userId)
      .eq("status", "completed")
      .eq("orders.payments.payment_status", "pending")

    completedQuery = supabase
      .from("delivery_assignments")
      .select("delivery_charge, delivery_charge_gst")
      .eq("delivery_partner_id", userId)
      .eq("status", "completed")
      .eq("orders.payments.payment_status", "completed")
  }

  const [totalResult, pendingResult, completedResult] = await Promise.all([totalQuery, pendingQuery, completedQuery])

  if (totalResult.error || pendingResult.error || completedResult.error) {
    console.error(
      "Error fetching payment statistics:",
      totalResult.error || pendingResult.error || completedResult.error,
    )
    throw new Error("Failed to fetch payment statistics")
  }

  let totalAmount = 0
  let pendingAmount = 0
  let completedAmount = 0

  if (userRole === "retailer") {
    totalAmount = totalResult.data.reduce((sum, item) => sum + item.total_amount, 0)
    pendingAmount = pendingResult.data.reduce((sum, item) => sum + item.amount, 0)
    completedAmount = completedResult.data.reduce((sum, item) => sum + item.amount, 0)
  } else if (userRole === "wholesaler") {
    totalAmount = totalResult.data.reduce((sum, item) => sum + item.wholesaler_payout, 0)
    pendingAmount = pendingResult.data.reduce((sum, item) => sum + item.wholesaler_payout, 0)
    completedAmount = completedResult.data.reduce((sum, item) => sum + item.wholesaler_payout, 0)
  } else if (userRole === "delivery") {
    totalAmount = totalResult.data.reduce((sum, item) => sum + item.delivery_charge + item.delivery_charge_gst, 0)
    pendingAmount = pendingResult.data.reduce((sum, item) => sum + item.delivery_charge + item.delivery_charge_gst, 0)
    completedAmount = completedResult.data.reduce(
      (sum, item) => sum + item.delivery_charge + item.delivery_charge_gst,
      0,
    )
  }

  return {
    totalAmount,
    pendingAmount,
    completedAmount,
  }
}

// Record a payment
export async function recordPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at">) {
  const { error } = await supabaseAdmin.from("payments").insert(payment)

  if (error) {
    console.error("Error recording payment:", error)
    throw new Error("Failed to record payment")
  }

  return { success: true }
}

// Update payment status
export async function updatePaymentStatus(paymentId: string, status: "pending" | "completed" | "failed") {
  const { error } = await supabase.from("payments").update({ payment_status: status }).eq("id", paymentId)

  if (error) {
    console.error("Error updating payment status:", error)
    throw new Error("Failed to update payment status")
  }

  return { success: true }
}

// Record COD collection
export async function recordCodCollection(paymentId: string, collectedBy: string) {
  const { error } = await supabase
    .from("payments")
    .update({
      payment_status: "completed",
      collected_by: collectedBy,
      payment_date: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("payment_method", "cod")

  if (error) {
    console.error("Error recording COD collection:", error)
    throw new Error("Failed to record COD collection")
  }

  return { success: true }
}

// Alias for recordCodCollection to match the required export
export const markCodPaymentCollected = recordCodCollection

// Verify UPI payment
export async function verifyUpiPayment(paymentId: string, transactionId: string) {
  // In a real app, you would verify with a payment gateway
  // For now, we'll just update the status
  const { error } = await supabase
    .from("payments")
    .update({
      payment_status: "completed",
      transaction_id: transactionId,
      payment_date: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("payment_method", "upi")

  if (error) {
    console.error("Error verifying UPI payment:", error)
    throw new Error("Failed to verify UPI payment")
  }

  return { success: true }
}
