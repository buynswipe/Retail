import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { PaymentMethod, PaymentStatus } from "./types"

// Define payment gateway types
export type PaymentGateway = "razorpay" | "paytm" | "phonepe" | "payu" | "cod"

// Define payment request interface
export interface PaymentRequest {
  orderId: string
  amount: number
  currency: string
  gateway: PaymentGateway
  metadata?: Record<string, any>
  redirectUrl?: string
}

// Define payment response interface
export interface PaymentResponse {
  success: boolean
  paymentId?: string
  gatewayReference?: string
  redirectUrl?: string
  message?: string
  status: PaymentStatus
}

export interface PaymentData {
  order_id: string
  amount: number
  payment_method: PaymentMethod
  transaction_id?: string
  upi_id?: string
  reference_id?: string
}

/**
 * Create a payment record
 * @param paymentData Payment data to create
 * @returns Promise with created payment data and error if any
 */
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

/**
 * Initialize a payment for an order
 * @param request Payment request details
 * @returns Promise with payment response
 */
export async function initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Validate the order exists and is in the correct state
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", request.orderId)
      .single()

    if (orderError) {
      throw new Error("Order not found or cannot be accessed")
    }

    if (order.payment_status !== "pending") {
      throw new Error(`Order is already in ${order.payment_status} state`)
    }

    // Handle different payment gateways
    let paymentResponse: PaymentResponse

    switch (request.gateway) {
      case "razorpay":
        paymentResponse = await initiateRazorpayPayment(request)
        break
      case "paytm":
        paymentResponse = await initiatePaytmPayment(request)
        break
      case "phonepe":
        paymentResponse = await initiatePhonePePayment(request)
        break
      case "payu":
        paymentResponse = await initiatePayUPayment(request)
        break
      case "cod":
        paymentResponse = await initiateCashOnDelivery(request)
        break
      default:
        throw new Error("Unsupported payment gateway")
    }

    // Update the order with payment information
    if (paymentResponse.success) {
      await supabase
        .from("orders")
        .update({
          payment_gateway: request.gateway,
          payment_id: paymentResponse.paymentId,
          payment_status: paymentResponse.status,
          gateway_reference: paymentResponse.gatewayReference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.orderId)
    }

    return paymentResponse
  } catch (error) {
    return errorHandler(error, "Error initiating payment", {
      success: false,
      status: "failed",
      message: "Payment initialization failed",
    })
  }
}

/**
 * Verify a payment callback/webhook
 * @param gatewayName Payment gateway name
 * @param payload Webhook payload
 * @returns Promise with verification result
 */
export async function verifyPaymentCallback(
  gatewayName: PaymentGateway,
  payload: any,
): Promise<{
  verified: boolean
  orderId?: string
  paymentId?: string
  status: PaymentStatus
}> {
  try {
    switch (gatewayName) {
      case "razorpay":
        return verifyRazorpayCallback(payload)
      case "paytm":
        return verifyPaytmCallback(payload)
      case "phonepe":
        return verifyPhonePeCallback(payload)
      case "payu":
        return verifyPayUCallback(payload)
      default:
        throw new Error("Unsupported payment gateway")
    }
  } catch (error) {
    return errorHandler(error, "Error verifying payment callback", {
      verified: false,
      status: "failed",
    })
  }
}

/**
 * Update payment status for an order
 * @param orderId Order ID to update
 * @param status New payment status
 * @param paymentDetails Additional payment details
 * @returns Promise with success status
 */
export async function updatePaymentStatus(
  orderId: string,
  status: PaymentStatus,
  paymentDetails: {
    paymentId?: string
    gatewayReference?: string
    metadata?: Record<string, any>
  } = {},
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: status,
        payment_id: paymentDetails.paymentId || undefined,
        gateway_reference: paymentDetails.gatewayReference || undefined,
        payment_metadata: paymentDetails.metadata || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    return errorHandler(error, "Error updating payment status", false)
  }
}

/**
 * Get available payment methods for a user
 * @param userId User ID to get payment methods for
 * @returns Promise with payment methods
 */
export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return data as PaymentMethod[]
  } catch (error) {
    return errorHandler(error, "Error getting payment methods", [])
  }
}

/**
 * Get payment by order ID
 * @param orderId Order ID to get payment for
 * @returns Promise with payment data and error if any
 */
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

/**
 * Get payments by user ID
 * @param userId User ID to get payments for
 * @param status Optional payment status filter
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with payment data, count, and error if any
 */
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

/**
 * Get payment statistics for a user
 * @param userId User ID to get statistics for
 * @param role User role (retailer or wholesaler)
 * @param timeframe Optional timeframe for statistics
 * @returns Promise with statistics data and error if any
 */
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

/**
 * Mark COD payment as collected (for delivery personnel)
 * @param paymentId Payment ID to mark as collected
 * @param amount Amount collected
 * @param collectedBy User ID of collector
 * @returns Promise with success status and error if any
 */
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

/**
 * Verify UPI payment
 * @param transactionId Transaction ID to verify
 * @param amount Expected amount
 * @returns Promise with verification status, details, and error if any
 */
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

// Private implementation functions for different payment gateways
async function initiateRazorpayPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Implementation for Razorpay
    const response = await fetch("/api/payments/razorpay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error("Failed to initialize Razorpay payment")
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      gatewayReference: data.order_id,
      status: "pending",
      redirectUrl: request.redirectUrl,
    }
  } catch (error) {
    return errorHandler(error, "Razorpay payment initialization failed", {
      success: false,
      status: "failed",
    })
  }
}

async function initiatePaytmPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Implementation for Paytm
    const response = await fetch("/api/payments/paytm/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error("Failed to initialize Paytm payment")
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      gatewayReference: data.txnToken,
      status: "pending",
      redirectUrl: data.redirectUrl,
    }
  } catch (error) {
    return errorHandler(error, "Paytm payment initialization failed", {
      success: false,
      status: "failed",
    })
  }
}

async function initiatePhonePePayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Implementation for PhonePe
    const response = await fetch("/api/payments/phonepe/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error("Failed to initialize PhonePe payment")
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      gatewayReference: data.providerReferenceId,
      status: "pending",
      redirectUrl: data.redirectUrl,
    }
  } catch (error) {
    return errorHandler(error, "PhonePe payment initialization failed", {
      success: false,
      status: "failed",
    })
  }
}

async function initiatePayUPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Implementation for PayU
    const response = await fetch("/api/payments/payu/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error("Failed to initialize PayU payment")
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      gatewayReference: data.txnid,
      status: "pending",
      redirectUrl: data.redirectUrl,
    }
  } catch (error) {
    return errorHandler(error, "PayU payment initialization failed", {
      success: false,
      status: "failed",
    })
  }
}

async function initiateCashOnDelivery(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // For COD, we just mark the payment as pending and return success
    return {
      success: true,
      paymentId: `COD-${request.orderId}`,
      status: "pending",
      message: "Cash on delivery payment initialized",
    }
  } catch (error) {
    return errorHandler(error, "COD initialization failed", {
      success: false,
      status: "failed",
    })
  }
}

// Verification functions for payment callbacks
async function verifyRazorpayCallback(payload: any): Promise<{
  verified: boolean
  orderId?: string
  paymentId?: string
  status: PaymentStatus
}> {
  try {
    // Implementation for Razorpay verification
    const response = await fetch("/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error("Razorpay verification failed")
    }

    const data = await response.json()

    return {
      verified: data.verified,
      orderId: data.orderId,
      paymentId: data.paymentId,
      status: data.status,
    }
  } catch (error) {
    return errorHandler(error, "Razorpay verification failed", {
      verified: false,
      status: "failed",
    })
  }
}

async function verifyPaytmCallback(payload: any): Promise<{
  verified: boolean
  orderId?: string
  paymentId?: string
  status: PaymentStatus
}> {
  try {
    // Implementation for Paytm verification
    const response = await fetch("/api/payments/paytm/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error("Paytm verification failed")
    }

    const data = await response.json()

    return {
      verified: data.verified,
      orderId: data.orderId,
      paymentId: data.paymentId,
      status: data.status,
    }
  } catch (error) {
    return errorHandler(error, "Paytm verification failed", {
      verified: false,
      status: "failed",
    })
  }
}

async function verifyPhonePeCallback(payload: any): Promise<{
  verified: boolean
  orderId?: string
  paymentId?: string
  status: PaymentStatus
}> {
  try {
    // Implementation for PhonePe verification
    const response = await fetch("/api/payments/phonepe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error("PhonePe verification failed")
    }

    const data = await response.json()

    return {
      verified: data.verified,
      orderId: data.orderId,
      paymentId: data.paymentId,
      status: data.status,
    }
  } catch (error) {
    return errorHandler(error, "PhonePe verification failed", {
      verified: false,
      status: "failed",
    })
  }
}

async function verifyPayUCallback(payload: any): Promise<{
  verified: boolean
  orderId?: string
  paymentId?: string
  status: PaymentStatus
}> {
  try {
    // Implementation for PayU verification
    const response = await fetch("/api/payments/payu/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error("PayU verification failed")
    }

    const data = await response.json()

    return {
      verified: data.verified,
      orderId: data.orderId,
      paymentId: data.paymentId,
      status: data.status,
    }
  } catch (error) {
    return errorHandler(error, "PayU verification failed", {
      verified: false,
      status: "failed",
    })
  }
}
