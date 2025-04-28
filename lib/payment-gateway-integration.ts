import { supabase } from "./supabase-client"
import { updatePaymentStatus } from "./order-service"
import { createNotification } from "./notification-service"
import { v4 as uuidv4 } from "uuid"

// Payment gateway types
export type PaymentGateway = "razorpay" | "paytm" | "phonepe" | "payu" | "upi" | "cod"

export interface PaymentRequest {
  orderId: string
  amount: number
  currency: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
  gateway: PaymentGateway
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  gatewayPaymentId?: string
  orderId?: string
  error?: string
  redirectUrl?: string
  paymentData?: any
}

export interface PaymentVerificationRequest {
  gateway: PaymentGateway
  orderId: string
  paymentId: string
  gatewayPaymentId?: string
  signature?: string
  responseData?: any
}

export interface PaymentVerificationResponse {
  success: boolean
  orderId?: string
  paymentId?: string
  error?: string
}

// Initialize payment gateways
export async function initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Create a payment record in the database
    const paymentId = uuidv4()
    const { error } = await supabase.from("payments").insert({
      id: paymentId,
      order_id: request.orderId,
      amount: request.amount,
      currency: request.currency,
      customer_id: request.customerId,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.customerPhone,
      description: request.description,
      gateway: request.gateway,
      status: "pending",
      metadata: request.metadata || {},
    })

    if (error) {
      throw error
    }

    // Handle different payment gateways
    switch (request.gateway) {
      case "razorpay":
        return await initializeRazorpayPayment(paymentId, request)
      case "paytm":
        return await initializePaytmPayment(paymentId, request)
      case "phonepe":
        return await initializePhonePePayment(paymentId, request)
      case "payu":
        return await initializePayUPayment(paymentId, request)
      case "upi":
        return await initializeUPIPayment(paymentId, request)
      case "cod":
        return await initializeCODPayment(paymentId, request)
      default:
        throw new Error(`Unsupported payment gateway: ${request.gateway}`)
    }
  } catch (error) {
    console.error("Payment initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize payment",
    }
  }
}

// Razorpay integration
async function initializeRazorpayPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured")
    }

    // In a real implementation, you would make an API call to Razorpay
    // For now, we'll simulate the response
    const razorpayOrderId = `rzp_${Date.now()}`

    // Update payment record with gateway order ID
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: razorpayOrderId,
        gateway_data: {
          key_id: process.env.RAZORPAY_KEY_ID,
          order_id: razorpayOrderId,
          amount: request.amount * 100, // Razorpay expects amount in paise
          currency: request.currency,
          name: "Retail Bandhu",
          description: request.description,
          prefill: {
            name: request.customerName,
            email: request.customerEmail,
            contact: request.customerPhone,
          },
          notes: {
            order_id: request.orderId,
            payment_id: paymentId,
          },
        },
      })
      .eq("id", paymentId)

    return {
      success: true,
      paymentId,
      gatewayPaymentId: razorpayOrderId,
      orderId: request.orderId,
      paymentData: {
        key: process.env.RAZORPAY_KEY_ID,
        amount: request.amount * 100,
        currency: request.currency,
        name: "Retail Bandhu",
        description: request.description,
        order_id: razorpayOrderId,
        prefill: {
          name: request.customerName,
          email: request.customerEmail,
          contact: request.customerPhone,
        },
        notes: {
          order_id: request.orderId,
          payment_id: paymentId,
        },
      },
    }
  } catch (error) {
    console.error("Razorpay initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize Razorpay payment",
    }
  }
}

// Paytm integration
async function initializePaytmPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    if (
      !process.env.PAYTM_MERCHANT_ID ||
      !process.env.PAYTM_MERCHANT_KEY ||
      !process.env.PAYTM_WEBSITE ||
      !process.env.PAYTM_INDUSTRY_TYPE ||
      !process.env.PAYTM_CHANNEL_ID
    ) {
      throw new Error("Paytm credentials not configured")
    }

    // In a real implementation, you would make an API call to Paytm
    // For now, we'll simulate the response
    const paytmOrderId = `paytm_${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/paytm`

    // Update payment record with gateway order ID
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: paytmOrderId,
        gateway_data: {
          MID: process.env.PAYTM_MERCHANT_ID,
          ORDER_ID: paytmOrderId,
          TXN_AMOUNT: request.amount.toString(),
          CUST_ID: request.customerId,
          INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE,
          WEBSITE: process.env.PAYTM_WEBSITE,
          CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
          CALLBACK_URL: callbackUrl,
          EMAIL: request.customerEmail,
          MOBILE_NO: request.customerPhone,
        },
      })
      .eq("id", paymentId)

    // In a real implementation, you would redirect to Paytm payment page
    // For now, we'll return a simulated redirect URL
    return {
      success: true,
      paymentId,
      gatewayPaymentId: paytmOrderId,
      orderId: request.orderId,
      redirectUrl: `https://securegw.paytm.in/theia/processTransaction?ORDER_ID=${paytmOrderId}`,
    }
  } catch (error) {
    console.error("Paytm initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize Paytm payment",
    }
  }
}

// PhonePe integration
async function initializePhonePePayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY || !process.env.PHONEPE_SALT_INDEX) {
      throw new Error("PhonePe credentials not configured")
    }

    // In a real implementation, you would make an API call to PhonePe
    // For now, we'll simulate the response
    const phonePeOrderId = `phonepe_${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/phonepe`

    // Update payment record with gateway order ID
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: phonePeOrderId,
        gateway_data: {
          merchantId: process.env.PHONEPE_MERCHANT_ID,
          transactionId: phonePeOrderId,
          amount: request.amount * 100, // PhonePe expects amount in paise
          merchantUserId: request.customerId,
          callbackUrl: callbackUrl,
          mobileNumber: request.customerPhone,
          paymentInstrument: {
            type: "UPI_INTENT",
          },
        },
      })
      .eq("id", paymentId)

    // In a real implementation, you would redirect to PhonePe payment page
    // For now, we'll return a simulated redirect URL
    return {
      success: true,
      paymentId,
      gatewayPaymentId: phonePeOrderId,
      orderId: request.orderId,
      redirectUrl: `https://mercury.phonepe.com/transact/simulator?transactionId=${phonePeOrderId}`,
    }
  } catch (error) {
    console.error("PhonePe initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize PhonePe payment",
    }
  }
}

// PayU integration
async function initializePayUPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    if (!process.env.PAYU_MERCHANT_KEY || !process.env.PAYU_MERCHANT_SALT) {
      throw new Error("PayU credentials not configured")
    }

    // In a real implementation, you would make an API call to PayU
    // For now, we'll simulate the response
    const payuOrderId = `payu_${Date.now()}`
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/payu/success`
    const failureUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/payu/failure`

    // Update payment record with gateway order ID
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: payuOrderId,
        gateway_data: {
          key: process.env.PAYU_MERCHANT_KEY,
          txnid: payuOrderId,
          amount: request.amount.toString(),
          productinfo: request.description,
          firstname: request.customerName,
          email: request.customerEmail,
          phone: request.customerPhone,
          surl: successUrl,
          furl: failureUrl,
          udf1: request.orderId,
          udf2: paymentId,
        },
      })
      .eq("id", paymentId)

    // In a real implementation, you would redirect to PayU payment page
    // For now, we'll return a simulated redirect URL
    return {
      success: true,
      paymentId,
      gatewayPaymentId: payuOrderId,
      orderId: request.orderId,
      redirectUrl: `https://test.payu.in/_payment?txnid=${payuOrderId}`,
    }
  } catch (error) {
    console.error("PayU initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize PayU payment",
    }
  }
}

// UPI integration (direct)
async function initializeUPIPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Generate UPI payment link
    const upiId = "retailbandhu@ybl" // Example UPI ID
    const upiPaymentId = `upi_${Date.now()}`
    const upiLink = `upi://pay?pa=${upiId}&pn=Retail%20Bandhu&am=${request.amount}&tr=${upiPaymentId}&tn=${encodeURIComponent(
      request.description,
    )}`

    // Update payment record with UPI details
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: upiPaymentId,
        gateway_data: {
          upi_id: upiId,
          upi_link: upiLink,
          amount: request.amount,
          reference: upiPaymentId,
        },
      })
      .eq("id", paymentId)

    return {
      success: true,
      paymentId,
      gatewayPaymentId: upiPaymentId,
      orderId: request.orderId,
      paymentData: {
        upiLink,
        upiId,
        amount: request.amount,
        reference: upiPaymentId,
      },
    }
  } catch (error) {
    console.error("UPI initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize UPI payment",
    }
  }
}

// Cash on Delivery
async function initializeCODPayment(paymentId: string, request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Update payment record for COD
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: `cod_${Date.now()}`,
        status: "pending",
        gateway_data: {
          payment_method: "Cash on Delivery",
          amount: request.amount,
        },
      })
      .eq("id", paymentId)

    // Update order payment status to COD
    await updatePaymentStatus(request.orderId, "pending")

    // Create notification for retailer
    await createNotification({
      user_id: request.customerId,
      title: "Order Placed with COD",
      message: `Your order #${request.orderId.slice(0, 8)} has been placed with Cash on Delivery.`,
      type: "payment",
      reference_id: request.orderId,
    })

    return {
      success: true,
      paymentId,
      orderId: request.orderId,
    }
  } catch (error) {
    console.error("COD initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize COD payment",
    }
  }
}

// Verify payment
export async function verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", request.paymentId)
      .single()

    if (paymentError || !payment) {
      throw paymentError || new Error("Payment not found")
    }

    // Verify payment based on gateway
    let isVerified = false
    const verificationDetails = {}

    switch (request.gateway) {
      case "razorpay":
        isVerified = await verifyRazorpayPayment(payment, request)
        break
      case "paytm":
        isVerified = await verifyPaytmPayment(payment, request)
        break
      case "phonepe":
        isVerified = await verifyPhonePePayment(payment, request)
        break
      case "payu":
        isVerified = await verifyPayUPayment(payment, request)
        break
      case "upi":
        isVerified = await verifyUPIPayment(payment, request)
        break
      case "cod":
        // COD is always verified at this stage
        isVerified = true
        break
      default:
        throw new Error(`Unsupported payment gateway: ${request.gateway}`)
    }

    if (isVerified) {
      // Update payment status
      await supabase
        .from("payments")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          verification_data: {
            ...verificationDetails,
            verified_at: new Date().toISOString(),
          },
        })
        .eq("id", request.paymentId)

      // Update order payment status
      await updatePaymentStatus(payment.order_id, "paid")

      // Create notification
      await createNotification({
        user_id: payment.customer_id,
        title: "Payment Successful",
        message: `Your payment for order #${payment.order_id.slice(0, 8)} has been successfully processed.`,
        type: "payment",
        reference_id: payment.order_id,
      })

      return {
        success: true,
        orderId: payment.order_id,
        paymentId: payment.id,
      }
    } else {
      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.paymentId)

      // Create notification
      await createNotification({
        user_id: payment.customer_id,
        title: "Payment Failed",
        message: `Your payment for order #${payment.order_id.slice(0, 8)} has failed. Please try again.`,
        type: "payment",
        reference_id: payment.order_id,
      })

      throw new Error("Payment verification failed")
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify payment",
    }
  }
}

// Verify Razorpay payment
async function verifyRazorpayPayment(payment: any, request: PaymentVerificationRequest): Promise<boolean> {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET || !request.signature || !request.gatewayPaymentId) {
      return false
    }

    // In a real implementation, you would verify the signature with Razorpay
    // For now, we'll simulate the verification
    return true
  } catch (error) {
    console.error("Razorpay verification error:", error)
    return false
  }
}

// Verify Paytm payment
async function verifyPaytmPayment(payment: any, request: PaymentVerificationRequest): Promise<boolean> {
  try {
    if (!process.env.PAYTM_MERCHANT_KEY || !request.responseData) {
      return false
    }

    // In a real implementation, you would verify the checksum with Paytm
    // For now, we'll simulate the verification
    return request.responseData.STATUS === "TXN_SUCCESS"
  } catch (error) {
    console.error("Paytm verification error:", error)
    return false
  }
}

// Verify PhonePe payment
async function verifyPhonePePayment(payment: any, request: PaymentVerificationRequest): Promise<boolean> {
  try {
    if (!process.env.PHONEPE_SALT_KEY || !request.responseData) {
      return false
    }

    // In a real implementation, you would verify the response with PhonePe
    // For now, we'll simulate the verification
    return request.responseData.code === "PAYMENT_SUCCESS"
  } catch (error) {
    console.error("PhonePe verification error:", error)
    return false
  }
}

// Verify PayU payment
async function verifyPayUPayment(payment: any, request: PaymentVerificationRequest): Promise<boolean> {
  try {
    if (!process.env.PAYU_MERCHANT_SALT || !request.responseData) {
      return false
    }

    // In a real implementation, you would verify the hash with PayU
    // For now, we'll simulate the verification
    return request.responseData.status === "success"
  } catch (error) {
    console.error("PayU verification error:", error)
    return false
  }
}

// Verify UPI payment
async function verifyUPIPayment(payment: any, request: PaymentVerificationRequest): Promise<boolean> {
  try {
    // In a real implementation, you would verify the UPI payment status
    // For now, we'll simulate the verification
    return true
  } catch (error) {
    console.error("UPI verification error:", error)
    return false
  }
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting payment:", error)
    return { data: null, error }
  }
}

// Get payments by order ID
export async function getPaymentsByOrderId(orderId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).order("created_at", {
      ascending: false,
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting payments:", error)
    return { data: null, error }
  }
}

// Get payments by customer ID
export async function getPaymentsByCustomerId(customerId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting payments:", error)
    return { data: null, error }
  }
}

// Update payment status manually (for COD or other manual payments)
export async function updatePaymentStatusManually(
  paymentId: string,
  status: string,
  updatedBy: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      throw paymentError || new Error("Payment not found")
    }

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status,
        updated_at: new Date().toISOString(),
        verification_data: {
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
          notes: `Payment status manually updated to ${status}`,
        },
      })
      .eq("id", paymentId)

    // Update order payment status if payment is completed
    if (status === "completed") {
      await updatePaymentStatus(payment.order_id, "paid")

      // Create notification
      await createNotification({
        user_id: payment.customer_id,
        title: "Payment Confirmed",
        message: `Your payment for order #${payment.order_id.slice(0, 8)} has been confirmed.`,
        type: "payment",
        reference_id: payment.order_id,
      })
    } else if (status === "failed") {
      // Create notification
      await createNotification({
        user_id: payment.customer_id,
        title: "Payment Failed",
        message: `Your payment for order #${payment.order_id.slice(0, 8)} has been marked as failed.`,
        type: "payment",
        reference_id: payment.order_id,
      })
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Refund payment
export async function refundPayment(
  paymentId: string,
  amount: number,
  reason: string,
  initiatedBy: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      throw paymentError || new Error("Payment not found")
    }

    // Check if payment can be refunded
    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded")
    }

    // Check if refund amount is valid
    if (amount <= 0 || amount > payment.amount) {
      throw new Error("Invalid refund amount")
    }

    // Create refund record
    const refundId = uuidv4()
    const { error: refundError } = await supabase.from("refunds").insert({
      id: refundId,
      payment_id: paymentId,
      order_id: payment.order_id,
      amount,
      reason,
      status: "pending",
      initiated_by: initiatedBy,
    })

    if (refundError) {
      throw refundError
    }

    // In a real implementation, you would initiate the refund with the payment gateway
    // For now, we'll simulate the refund process

    // Update refund status to completed
    await supabase
      .from("refunds")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", refundId)

    // Update payment status if full refund
    if (amount === payment.amount) {
      await supabase
        .from("payments")
        .update({
          status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)

      // Update order payment status
      await updatePaymentStatus(payment.order_id, "refunded")
    } else {
      // Partial refund
      await supabase
        .from("payments")
        .update({
          status: "partially_refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)

      // Update order payment status
      await updatePaymentStatus(payment.order_id, "partially_paid")
    }

    // Create notification
    await createNotification({
      user_id: payment.customer_id,
      title: "Payment Refunded",
      message: `Your payment for order #${payment.order_id.slice(0, 8)} has been ${
        amount === payment.amount ? "fully" : "partially"
      } refunded.`,
      type: "payment",
      reference_id: payment.order_id,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error refunding payment:", error)
    return { success: false, error }
  }
}
