import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import { trackPaymentEvent } from "./payment-analytics"
import crypto from "crypto"

// Get payments by user ID
export async function getPaymentsByUserId(userId: string, userType: "retailer" | "wholesaler", limit = 50, offset = 0) {
  try {
    // Determine the user ID field based on user type
    const userIdField = userType === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get payments with order details
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          ${userIdField},
          total_amount,
          order_status,
          payment_status
        )
      `,
      )
      .eq(`order.${userIdField}`, userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return errorHandler(error, "Error getting payments by user ID", { data: [], error })
  }
}

// Get payment statistics
export async function getPaymentStatistics(
  userId: string,
  userType: "retailer" | "wholesaler",
  timeframe: "week" | "month" | "year" = "month",
) {
  try {
    // Determine the user ID field based on user type
    const userIdField = userType === "retailer" ? "retailer_id" : "wholesaler_id"

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    let period: string

    switch (timeframe) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        period = "Last 7 days"
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        period = "Last 12 months"
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        period = "Last 30 days"
        break
    }

    const startDateStr = startDate.toISOString()

    // Get payments with order details
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          ${userIdField},
          total_amount,
          order_status,
          payment_status
        )
      `,
      )
      .eq(`order.${userIdField}`, userId)
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Calculate statistics
    const totalPayments = payments.length
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const completedPayments = payments.filter((payment) => payment.payment_status === "completed").length
    const pendingPayments = payments.filter((payment) => payment.payment_status === "pending").length
    const failedPayments = payments.filter((payment) => payment.payment_status === "failed").length
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0

    // Calculate payment methods distribution
    const paymentMethods: Record<string, number> = {}
    payments.forEach((payment) => {
      const method = payment.payment_method
      paymentMethods[method] = (paymentMethods[method] || 0) + 1
    })

    return {
      data: {
        totalPayments,
        totalAmount,
        completedPayments,
        pendingPayments,
        failedPayments,
        completionRate,
        paymentMethods,
        period,
      },
      error: null,
    }
  } catch (error) {
    return errorHandler(error, "Error getting payment statistics", {
      data: {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        completionRate: 0,
        paymentMethods: {},
        period: "",
      },
      error,
    })
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @returns Result of the function
 */
async function retryOperation<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retryCount = 0
  let lastError: any

  while (retryCount < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      retryCount++

      if (retryCount >= maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  status: "completed" | "pending" | "failed",
  paymentDetails?: {
    paymentId?: string
    gatewayReference?: string
    metadata?: any
  },
) {
  return retryOperation(async () => {
    try {
      // Get the payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .single()

      if (paymentError) {
        throw paymentError
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          payment_status: status,
          transaction_id: paymentDetails?.paymentId || payment.transaction_id,
          reference_id: paymentDetails?.gatewayReference || payment.reference_id,
          payment_date: status === "completed" ? new Date().toISOString() : payment.payment_date,
          updated_at: new Date().toISOString(),
          metadata: paymentDetails?.metadata || payment.metadata,
        })
        .eq("id", payment.id)

      if (updateError) {
        throw updateError
      }

      // Update order payment status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (orderError) {
        throw orderError
      }

      // Get order details for tracking
      const { data: order, error: orderFetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderFetchError) {
        throw orderFetchError
      }

      // Track payment event
      await trackPaymentEvent({
        event_type:
          status === "completed" ? "payment_completed" : status === "failed" ? "payment_failed" : "payment_initiated",
        user_id: order.retailer_id,
        order_id: orderId,
        payment_id: payment.id,
        payment_method: payment.payment_method,
        amount: payment.amount,
        gateway: "payu", // Default to PayU for now
        metadata: paymentDetails?.metadata,
      })

      return { success: true, error: null }
    } catch (error) {
      return errorHandler(error, "Error updating payment status", { success: false, error })
    }
  })
}

// Create PayU payment
export async function createPayUPayment(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  productInfo: string,
  isRetry = false,
) {
  try {
    // Get PayU merchant key and salt
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      throw new Error("PayU merchant key or salt is missing")
    }

    // Generate transaction ID
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Create hash
    const hashString = `${merchantKey}|${txnId}|${amount}|${productInfo}|${customerName}|${customerEmail}|||||||||||${merchantSalt}`
    const hash = crypto.createHash("sha512").update(hashString).digest("hex")

    // Create payment record or update existing one
    let paymentId: string

    if (isRetry) {
      // Get existing payment record
      const { data: existingPayment, error: paymentError } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .single()

      if (paymentError) {
        throw paymentError
      }

      paymentId = existingPayment.id

      // Update payment record
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          reference_id: txnId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)

      if (updateError) {
        throw updateError
      }

      // Track payment retry event
      await trackPaymentEvent({
        event_type: "payment_retried",
        user_id: customerEmail, // Use email as user ID temporarily
        order_id: orderId,
        payment_id: paymentId,
        payment_method: "payu",
        amount,
        gateway: "payu",
      })
    } else {
      // Create new payment record
      const { data: newPayment, error: createError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          amount,
          payment_method: "payu",
          payment_status: "pending",
          reference_id: txnId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      paymentId = newPayment.id

      // Track payment initiated event
      await trackPaymentEvent({
        event_type: "payment_initiated",
        user_id: customerEmail, // Use email as user ID temporarily
        order_id: orderId,
        payment_id: paymentId,
        payment_method: "payu",
        amount,
        gateway: "payu",
      })
    }

    // Return payment details
    return {
      data: {
        merchantKey,
        txnId,
        amount,
        productInfo,
        customerName,
        customerEmail,
        customerPhone,
        hash,
        udf1: orderId, // Store order ID in udf1 field
        paymentId,
        isRetry,
      },
      error: null,
    }
  } catch (error) {
    return errorHandler(error, "Error creating PayU payment", { data: null, error })
  }
}

// Verify PayU payment
export async function verifyPayUPayment(paymentId: string, transactionId: string) {
  try {
    // Get PayU merchant key and salt
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      throw new Error("PayU merchant key or salt is missing")
    }

    // Create verification payload
    const payload = {
      key: merchantKey,
      command: "verify_payment",
      var1: transactionId, // Transaction ID
    }

    // Create hash
    const hashString = `${merchantKey}|verify_payment|${transactionId}|${merchantSalt}`
    const hash = crypto.createHash("sha512").update(hashString).digest("hex")

    // Make API request to PayU
    const response = await fetch("https://secure.payu.in/merchant/postservice?form=2", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        key: merchantKey,
        command: "verify_payment",
        var1: transactionId,
        hash: hash,
      }).toString(),
    })

    const data = await response.json()

    // Check if verification was successful
    if (data.status === 1 && data.transaction_details && data.transaction_details[transactionId]) {
      const txnDetails = data.transaction_details[transactionId]
      const status =
        txnDetails.status === "success" ? "completed" : txnDetails.status === "failure" ? "failed" : "pending"

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("order_id")
        .eq("id", paymentId)
        .single()

      if (paymentError) {
        throw paymentError
      }

      // Update payment status
      await updatePaymentStatus(payment.order_id, status, {
        paymentId: txnDetails.mihpayid,
        gatewayReference: transactionId,
        metadata: txnDetails,
      })

      return { data: { verified: true, status, details: txnDetails }, error: null }
    } else {
      return { data: { verified: false, status: "unknown", details: data }, error: null }
    }
  } catch (error) {
    return errorHandler(error, "Error verifying PayU payment", { data: { verified: false, status: "error" }, error })
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return errorHandler(error, "Error getting payment by order ID", { data: null, error })
  }
}

// Retry failed payment
export async function retryFailedPayment(orderId: string, paymentId: string) {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) {
      throw orderError
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from("users")
      .select("name, email, phone")
      .eq("id", order.retailer_id)
      .single()

    if (customerError) {
      throw customerError
    }

    // Create new PayU payment with retry flag
    const result = await createPayUPayment(
      orderId,
      payment.amount,
      customer.name,
      customer.email,
      customer.phone,
      `Order #${order.order_number}`,
      true, // Mark as retry
    )

    return result
  } catch (error) {
    return errorHandler(error, "Error retrying failed payment", { data: null, error })
  }
}

// Create a payment record
export async function createPayment(paymentData: {
  order_id: string
  amount: number
  payment_method: string
  transaction_id?: string
  upi_id?: string
  reference_id?: string
}) {
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

    // Track payment event
    await trackPaymentEvent({
      event_type: "payment_completed",
      user_id: collectedBy,
      order_id: payment.order_id,
      payment_id: paymentId,
      payment_method: "cod",
      amount: amount,
      gateway: "cod",
      metadata: { collected_by: collectedBy },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking COD payment as collected:", error)
    return { success: false, error: "Failed to mark payment as collected" }
  }
}
