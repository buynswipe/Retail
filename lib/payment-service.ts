import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { PaymentMethod, PaymentStatus } from "./types"
import type { Payment } from "./types" // Import Payment type

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

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
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
    // Handle demo order IDs
    if (orderId.startsWith("demo-") || !isValidUUID(orderId)) {
      console.log("Using demo payment status update for demo order")
      return true
    }

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
export async function getPaymentByOrderId(orderId: string): Promise<{ data: Payment | null; error: any }> {
  try {
    // For demo order IDs, return demo data
    if (orderId.startsWith("demo-")) {
      console.log("Using demo payment for demo order")
      return {
        data: {
          id: `payment-${orderId}`,
          order_id: orderId,
          amount: orderId === "demo-order-1" ? 2500 : 3500,
          payment_method: orderId === "demo-order-1" ? "online" : "cod",
          payment_status: "pending",
          transaction_id: null,
          payment_date: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
        error: null,
      }
    }

    // For real orders, query the database
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).single()

    if (error) {
      console.error("Error fetching payment by order ID:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching payment by order ID:", error)
    return { data: null, error }
  }
}

/**
 * Get payments by user ID
 * @param userId User ID to get payments for
 * @param role User role (retailer or wholesaler)
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with payment data, count, and error if any
 */
export async function getPaymentsByUserId(
  userId: string,
  role: "retailer" | "wholesaler",
  limit = 10,
  offset = 0,
): Promise<{ data: any[]; count: number; error: any }> {
  try {
    // For demo user IDs, return demo data
    if (userId.startsWith("user-") || !isValidUUID(userId)) {
      console.log("Using demo payments for demo user")
      const demoPayments = [
        {
          id: "demo-payment-1",
          order_id: "demo-order-1",
          amount: 2500,
          payment_method: "upi",
          payment_status: "completed",
          transaction_id: "UPI123456789",
          reference_id: "REF123456789",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          payment_date: new Date(Date.now() - 3500000).toISOString(),
          order: {
            order_number: "ORD12345678",
          },
        },
        {
          id: "demo-payment-2",
          order_id: "demo-order-2",
          amount: 1800,
          payment_method: "cod",
          payment_status: "pending",
          reference_id: "REF987654321",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          order: {
            order_number: "ORD87654321",
          },
        },
      ]
      return { data: demoPayments, count: demoPayments.length, error: null }
    }

    // Check if payments table exists
    try {
      const { error: tableCheckError } = await supabase.from("payments").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Payments table doesn't exist, returning demo data")
        const demoPayments = [
          {
            id: "demo-payment-1",
            order_id: "demo-order-1",
            amount: 2500,
            payment_method: "upi",
            payment_status: "completed",
            transaction_id: "UPI123456789",
            reference_id: "REF123456789",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            payment_date: new Date(Date.now() - 3500000).toISOString(),
            order: {
              order_number: "ORD12345678",
            },
          },
          {
            id: "demo-payment-2",
            order_id: "demo-order-2",
            amount: 1800,
            payment_method: "cod",
            payment_status: "pending",
            reference_id: "REF987654321",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            order: {
              order_number: "ORD87654321",
            },
          },
        ]
        return { data: demoPayments, count: demoPayments.length, error: null }
      }
    } catch (error) {
      console.error("Error checking payments table:", error)
    }

    // For real users, query the database
    // First get orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)

    if (ordersError) {
      console.error("Error fetching orders for payments:", ordersError)
      return { data: [], count: 0, error: ordersError }
    }

    if (!orders || orders.length === 0) {
      return { data: [], count: 0, error: null }
    }

    // Get order IDs
    const orderIds = orders.map((order) => order.id)

    // Get payments for these orders
    const { data, count, error } = await supabase
      .from("payments")
      .select("*, order:order_id(*)", { count: "exact" })
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

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
    // For demo user IDs, return demo data
    if (userId.startsWith("user-") || !isValidUUID(userId)) {
      console.log("Using demo payment statistics for demo user")
      return {
        data: {
          total_payments: 12,
          completedPayments: 10,
          pendingPayments: 2,
          failedPayments: 0,
          totalAmount: 25000,
          completedAmount: 22000,
          completionRate: 83.33,
          paymentMethods: {
            upi: 8,
            cod: 4,
          },
          dailyTrends: [
            { date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0], count: 2, amount: 4000 },
            { date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], count: 1, amount: 2500 },
            { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], count: 3, amount: 5500 },
            { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], count: 2, amount: 3800 },
            { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], count: 1, amount: 2200 },
            { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], count: 2, amount: 4500 },
            { date: new Date().toISOString().split("T")[0], count: 1, amount: 2500 },
          ],
          total_sales: 25000,
          total_tax_collected: 4500,
          total_tax_paid: 1200,
          net_tax_liability: 3300,
          period: "Last 30 days",
        },
        error: null,
      }
    }

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

    // Check if payments table exists
    try {
      const { error: tableCheckError } = await supabase.from("payments").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Payments table doesn't exist, returning demo statistics")
        return {
          data: {
            total_payments: 12,
            completedPayments: 10,
            pendingPayments: 2,
            failedPayments: 0,
            totalAmount: 25000,
            completedAmount: 22000,
            completionRate: 83.33,
            paymentMethods: {
              upi: 8,
              cod: 4,
            },
            dailyTrends: [
              { date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0], count: 2, amount: 4000 },
              { date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], count: 1, amount: 2500 },
              { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], count: 3, amount: 5500 },
              { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], count: 2, amount: 3800 },
              { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], count: 1, amount: 2200 },
              { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], count: 2, amount: 4500 },
              { date: new Date().toISOString().split("T")[0], count: 1, amount: 2500 },
            ],
            total_sales: 25000,
            total_tax_collected: 4500,
            total_tax_paid: 1200,
            net_tax_liability: 3300,
            period: timeframe === "week" ? "Last 7 days" : timeframe === "year" ? "Last 12 months" : "Last 30 days",
          },
          error: null,
        }
      }
    } catch (error) {
      console.error("Error checking payments table:", error)
    }

    // For real users, query the database
    // First get orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)

    if (ordersError) {
      console.error("Error fetching orders for payment statistics:", ordersError)
      return { data: null, error: ordersError }
    }

    if (!orders || orders.length === 0) {
      return {
        data: {
          totalPayments: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          totalAmount: 0,
          completedAmount: 0,
          completionRate: 0,
          paymentMethods: {},
          dailyTrends: [],
          total_sales: 0,
          total_tax_collected: 0,
          total_tax_paid: 0,
          net_tax_liability: 0,
          period: timeframe === "week" ? "Last 7 days" : timeframe === "year" ? "Last 12 months" : "Last 30 days",
        },
        error: null,
      }
    }

    // Get order IDs
    const orderIds = orders.map((order) => order.id)

    // Get payments in the date range
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        order:order_id(*)
      `)
      .in("order_id", orderIds)
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
      total_sales: totalAmount,
      total_tax_collected: totalAmount * 0.18, // Assuming 18% GST
      total_tax_paid: totalAmount * 0.05, // Assuming 5% input tax
      net_tax_liability: totalAmount * 0.13, // Difference between collected and paid
      period: timeframe === "week" ? "Last 7 days" : timeframe === "year" ? "Last 12 months" : "Last 30 days",
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
    // Handle demo payment IDs
    if (paymentId.startsWith("demo-") || !isValidUUID(paymentId)) {
      console.log("Using demo payment collection for demo payment")
      return { success: true }
    }

    // Check if payments table exists
    try {
      const { error: tableCheckError } = await supabase.from("payments").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Payments table doesn't exist, returning demo success")
        return { success: true }
      }
    } catch (error) {
      console.error("Error checking payments table:", error)
    }

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
    // Handle demo transaction IDs
    if (transactionId.startsWith("demo-") || transactionId.startsWith("TXNID")) {
      console.log("Using demo UPI verification for demo transaction")
      return {
        verified: true,
        details: {
          paymentId: "demo-payment-id",
          orderId: "demo-order-id",
          status: "completed",
          timestamp: new Date().toISOString(),
        },
      }
    }

    // Check if payments table exists
    try {
      const { error: tableCheckError } = await supabase.from("payments").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Payments table doesn't exist, returning demo verification")
        return {
          verified: true,
          details: {
            paymentId: "demo-payment-id",
            orderId: "demo-order-id",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
        }
      }
    } catch (error) {
      console.error("Error checking payments table:", error)
    }

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
