import { supabase } from "./supabase-client"
import type { PaymentMethod, PaymentStatus } from "./types"

export interface PaymentData {
  order_id: string
  amount: number
  payment_method: PaymentMethod
  transaction_id?: string
  upi_id?: string
  reference_id?: string
}

// Create a payment record
export async function createPayment(paymentData: PaymentData): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_status: "pending",
        transaction_id: paymentData.transaction_id,
        upi_id: paymentData.upi_id,
        reference_id: paymentData.reference_id || `REF${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payment:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { data: null, error }
  }
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  transactionId?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: status,
        transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (error) {
      console.error("Error updating payment status:", error)
      return { success: false, error }
    }

    // If payment is completed, update the order payment status as well
    if (status === "completed") {
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("order_id")
        .eq("id", paymentId)
        .single()

      if (paymentError) {
        console.error("Error fetching payment:", paymentError)
        return { success: true, error: null } // Still return success for the payment update
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          transaction_id: transactionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id)

      if (orderError) {
        console.error("Error updating order payment status:", orderError)
        // Still return success for the payment update
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).single()

    if (error) {
      console.error("Error fetching payment:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching payment:", error)
    return { data: null, error }
  }
}

// Get payments by user
export async function getPaymentsByUser(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{ data: any[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        order:order_id(*)
      `)
      .eq(`order.${role === "retailer" ? "retailer_id" : "wholesaler_id"}`, userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { data: [], error }
  }
}

// Process UPI payment (mock implementation)
export async function processUpiPayment(
  orderId: string,
  amount: number,
  upiId: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // In a real app, this would call a payment gateway API
    // For demo purposes, we'll simulate a successful payment
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call delay

    // Generate a mock transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Create payment record
    const { error } = await supabase.from("payments").insert({
      order_id: orderId,
      amount,
      payment_method: "upi",
      payment_status: "completed",
      transaction_id: transactionId,
      upi_id: upiId,
      reference_id: `REF${Date.now()}`,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating payment record:", error)
      return { success: false, error: "Failed to create payment record" }
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      console.error("Error updating order payment status:", orderError)
      return { success: true, transactionId, error: "Payment successful but order status update failed" }
    }

    return { success: true, transactionId }
  } catch (error) {
    console.error("Error processing UPI payment:", error)
    return { success: false, error: "Payment processing failed" }
  }
}

// Process Cash on Delivery payment (mock implementation)
export async function processCodPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Create payment record
    const { error } = await supabase.from("payments").insert({
      order_id: orderId,
      amount: 0, // Will be updated when order is delivered
      payment_method: "cod",
      payment_status: "pending",
      reference_id: `COD${Date.now()}`,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating COD payment record:", error)
      return { success: false, error: "Failed to create payment record" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error processing COD payment:", error)
    return { success: false, error: "Payment processing failed" }
  }
}

// Mark COD payment as collected (for delivery personnel)
export async function markCodPaymentCollected(
  paymentId: string,
  amount: number,
  collectedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment record
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        amount: amount,
        collected_by: collectedBy,
        collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (error) {
      console.error("Error marking COD payment as collected:", error)
      return { success: false, error: "Failed to update payment record" }
    }

    // Get order ID from payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("order_id")
      .eq("id", paymentId)
      .single()

    if (paymentError) {
      console.error("Error fetching payment:", paymentError)
      return { success: true, error: "Payment marked as collected but order status update failed" }
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)

    if (orderError) {
      console.error("Error updating order payment status:", orderError)
      return { success: true, error: "Payment marked as collected but order status update failed" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking COD payment as collected:", error)
    return { success: false, error: "Failed to mark payment as collected" }
  }
}

// Get payments by user ID (different from getPaymentsByUser as it doesn't join with orders)
export async function getPaymentsByUserId(
  userId: string,
  status?: PaymentStatus,
  limit = 10,
  offset = 0,
): Promise<{ data: any[]; count: number; error: any }> {
  try {
    let query = supabase
      .from("payments")
      .select(
        `
        *,
        order:order_id(retailer_id, wholesaler_id)
      `,
        { count: "exact" },
      )
      .or(`order.retailer_id.eq.${userId},order.wholesaler_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("payment_status", status)
    }

    const { data, count, error } = await query

    if (error) {
      console.error("Error fetching payments by user ID:", error)
      return { data: [], count: 0, error }
    }

    return { data: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching payments by user ID:", error)
    return { data: [], count: 0, error }
  }
}

// Get payment statistics for a user
export async function getPaymentStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
  timeframe: "week" | "month" | "year" = "month",
): Promise<{ data: any; error: any }> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get payments in the date range
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        order:order_id(*)
      `)
      .eq(`order.${role === "retailer" ? "retailer_id" : "wholesaler_id"}`, userId)
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching payment statistics:", error)
      return { data: null, error }
    }

    // Calculate statistics
    const totalPayments = payments?.length || 0
    const completedPayments = payments?.filter((p) => p.payment_status === "completed").length || 0
    const pendingPayments = payments?.filter((p) => p.payment_status === "pending").length || 0
    const failedPayments = payments?.filter((p) => p.payment_status === "failed").length || 0

    const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const completedAmount =
      payments?.filter((p) => p.payment_status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Group by payment method
    const paymentMethods: Record<string, number> = {}
    payments?.forEach((p) => {
      const method = p.payment_method
      paymentMethods[method] = (paymentMethods[method] || 0) + 1
    })

    // Group by day for trend analysis
    const dailyTrends: Record<string, { count: number; amount: number }> = {}
    payments?.forEach((p) => {
      const day = p.created_at.split("T")[0]
      if (!dailyTrends[day]) {
        dailyTrends[day] = { count: 0, amount: 0 }
      }
      dailyTrends[day].count += 1
      dailyTrends[day].amount += p.amount || 0
    })

    const statistics = {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      completedAmount,
      completionRate: totalPayments ? (completedPayments / totalPayments) * 100 : 0,
      paymentMethods,
      dailyTrends: Object.entries(dailyTrends).map(([date, data]) => ({
        date,
        count: data.count,
        amount: data.amount,
      })),
    }

    return { data: statistics, error: null }
  } catch (error) {
    console.error("Error calculating payment statistics:", error)
    return { data: null, error }
  }
}

// Verify UPI payment (mock implementation)
export async function verifyUpiPayment(
  transactionId: string,
  amount: number,
): Promise<{ verified: boolean; details?: any; error?: string }> {
  try {
    // In a real app, this would call a payment gateway API to verify the transaction
    // For demo purposes, we'll simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call delay

    // Check if transaction exists in our database
    const { data, error } = await supabase.from("payments").select("*").eq("transaction_id", transactionId).single()

    if (error) {
      console.error("Error verifying UPI payment:", error)
      return { verified: false, error: "Transaction not found" }
    }

    // Verify amount matches
    if (data.amount !== amount) {
      return {
        verified: false,
        details: {
          expected: data.amount,
          received: amount,
        },
        error: "Amount mismatch",
      }
    }

    // In a real implementation, we would also check the status from the payment gateway

    return {
      verified: true,
      details: {
        paymentId: data.id,
        orderId: data.order_id,
        status: data.payment_status,
        timestamp: data.created_at,
      },
    }
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return { verified: false, error: "Verification failed" }
  }
}
