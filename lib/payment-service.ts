import { supabase } from "./supabase-client"
import type { Payment } from "./supabase-client"

// Get payment by ID
export async function getPaymentById(paymentId: string) {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).single()

    if (error) throw error
    return data as Payment
  } catch (error) {
    console.error("Error fetching payment:", error)
    return null
  }
}

// Get payments by order ID
export async function getPaymentsByOrderId(orderId: string) {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId)

    if (error) throw error
    return data as Payment[]
  } catch (error) {
    console.error("Error fetching payments for order:", error)
    return []
  }
}

// Create a new payment
export async function createPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at" | "reference_id">) {
  try {
    const referenceId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const newPayment = {
      ...payment,
      reference_id: referenceId,
    }

    const { data, error } = await supabase.from("payments").insert([newPayment]).select()

    if (error) throw error
    return data?.[0] as Payment
  } catch (error) {
    console.error("Error creating payment:", error)
    return null
  }
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: string,
  status: Payment["payment_status"],
  transactionId?: string,
) {
  try {
    const updates: Partial<Payment> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    }

    if (transactionId) {
      updates.transaction_id = transactionId
    }

    const { data, error } = await supabase.from("payments").update(updates).eq("id", paymentId).select()

    if (error) throw error
    return data?.[0] as Payment
  } catch (error) {
    console.error("Error updating payment status:", error)
    return null
  }
}

// Record COD collection
export async function recordCodCollection(paymentId: string, collectedBy: string) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        collected_by: collectedBy,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("payment_method", "cod")
      .select()

    if (error) throw error
    return data?.[0] as Payment
  } catch (error) {
    console.error("Error recording COD collection:", error)
    return null
  }
}

// Alias for recordCodCollection
export const markCodPaymentCollected = recordCodCollection

// Verify UPI payment
export async function verifyUpiPayment(paymentId: string, transactionId: string) {
  try {
    // In a real implementation, this would call a payment gateway API
    // For now, we'll simulate a successful verification

    const { data, error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        transaction_id: transactionId,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("payment_method", "upi")
      .select()

    if (error) throw error
    return {
      success: true,
      payment: data?.[0] as Payment,
    }
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return {
      success: false,
      error: "Payment verification failed",
    }
  }
}

// Get payments by user ID (works for retailers, wholesalers, etc.)
export async function getPaymentsByUserId(userId: string, role: "retailer" | "wholesaler") {
  try {
    let query = supabase.from("payments").select(`
        *,
        orders!inner(*)
      `)

    if (role === "retailer") {
      query = query.eq("orders.retailer_id", userId)
    } else if (role === "wholesaler") {
      query = query.eq("orders.wholesaler_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data.map((item) => ({
      ...item.payments,
      order: item.orders,
    }))
  } catch (error) {
    console.error(`Error fetching payments for ${role}:`, error)
    return []
  }
}

// Get payment statistics
export async function getPaymentStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
  period: "week" | "month" | "year" = "month",
) {
  try {
    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    if (period === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    // Format dates for Postgres
    const startDateStr = startDate.toISOString()
    const endDateStr = now.toISOString()

    let query = supabase
      .from("payments")
      .select(`
        *,
        orders!inner(*)
      `)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (role === "retailer") {
      query = query.eq("orders.retailer_id", userId)
    } else if (role === "wholesaler") {
      query = query.eq("orders.wholesaler_id", userId)
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate statistics
    const total = data.length
    const completed = data.filter((item) => item.payment_status === "completed").length
    const pending = data.filter((item) => item.payment_status === "pending").length
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

    return {
      total,
      completed,
      pending,
      totalAmount,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      period,
    }
  } catch (error) {
    console.error(`Error fetching payment statistics for ${role}:`, error)
    return {
      total: 0,
      completed: 0,
      pending: 0,
      totalAmount: 0,
      completionRate: 0,
      period,
    }
  }
}
