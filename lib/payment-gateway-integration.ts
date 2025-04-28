import { createClient } from "./supabase-client"
import { createNotification } from "./notification-service"
import crypto from "crypto"
import { createHmac } from "crypto"
import { v4 as uuidv4 } from "uuid"
import type { User } from "./types"

export type PaymentGateway = "razorpay" | "paytm" | "phonepe" | "payu"

export interface PaymentInitiationResponse {
  success: boolean
  redirectUrl?: string
  formData?: Record<string, string>
  formAction?: string
  method?: "GET" | "POST"
  orderId?: string
  error?: string
}

interface PaymentVerificationParams {
  gateway: string
  orderId: string
  paymentId: string
  gatewayPaymentId?: string
  signature?: string
  responseData?: any
}

interface PaymentVerificationResult {
  success: boolean
  error?: string
  orderId?: string
  paymentId?: string
}

// Add the missing initializePayment export
export async function initializePayment(request: {
  orderId: string
  amount: number
  currency: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
  gateway: string
  metadata?: Record<string, any>
}): Promise<{
  success: boolean
  paymentId?: string
  gatewayPaymentId?: string
  orderId?: string
  error?: string
  redirectUrl?: string
  paymentData?: any
}> {
  try {
    const supabase = createClient()

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

    // Create payment intent based on gateway
    let paymentIntent
    switch (request.gateway) {
      case "razorpay":
        paymentIntent = await createRazorpayIntent(request.orderId, paymentId, request.amount)
        break
      case "paytm":
        paymentIntent = await createPaytmIntent(request.orderId, paymentId, request.amount)
        break
      case "phonepe":
        paymentIntent = await createPhonePeIntent(request.orderId, paymentId, request.amount)
        break
      case "payu":
        paymentIntent = await createPayUIntent(request.orderId, paymentId, request.amount)
        break
      default:
        throw new Error(`Unsupported payment gateway: ${request.gateway}`)
    }

    if (!paymentIntent.success) {
      throw new Error(paymentIntent.error || "Failed to create payment intent")
    }

    // Update payment record with gateway-specific details
    await supabase
      .from("payments")
      .update({
        payment_details: paymentIntent.data,
      })
      .eq("id", paymentId)

    return {
      success: true,
      paymentId,
      gatewayPaymentId: paymentIntent.data.id,
      orderId: request.orderId,
      paymentData: paymentIntent.data,
    }
  } catch (error) {
    console.error("Payment initialization error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize payment",
    }
  }
}

// Add the missing getPaymentsByCustomerId export
export async function getPaymentsByCustomerId(customerId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const supabase = createClient()
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

export async function verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
  try {
    const supabase = createClient()
    const { gateway, orderId, paymentId, gatewayPaymentId, signature, responseData } = params

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      throw paymentError || new Error("Payment not found")
    }

    // Verify payment based on gateway
    let isValid = false
    let verificationDetails = {}

    switch (gateway) {
      case "razorpay":
        isValid = verifyRazorpayPayment(payment, gatewayPaymentId, signature, responseData)
        verificationDetails = {
          razorpay_payment_id: gatewayPaymentId,
          razorpay_signature: signature,
        }
        break

      case "paytm":
        isValid = verifyPaytmPayment(payment, gatewayPaymentId, responseData)
        verificationDetails = responseData
        break

      case "phonepe":
        isValid = verifyPhonePePayment(payment, gatewayPaymentId, responseData)
        verificationDetails = responseData
        break

      case "payu":
        isValid = verifyPayUPayment(payment, gatewayPaymentId, responseData)
        verificationDetails = responseData
        break

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`)
    }

    if (!isValid) {
      throw new Error("Payment verification failed")
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        gateway_payment_id: gatewayPaymentId,
        payment_details: {
          ...payment.payment_details,
          verification: verificationDetails,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (updateError) {
      throw updateError
    }

    // Update order status
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderUpdateError) {
      throw orderUpdateError
    }

    // Get order details for notification
    const { data: order } = await supabase
      .from("orders")
      .select("retailer_id, wholesaler_id, total_amount")
      .eq("id", orderId)
      .single()

    if (order) {
      // Create payment notifications
      await createNotification({
        user_id: order.retailer_id,
        title: "Payment Successful",
        message: `Your payment of ${payment.amount.toFixed(2)} for order #${orderId.slice(0, 8)} was successful.`,
        type: "payment",
        reference_id: orderId,
      })

      await createNotification({
        user_id: order.wholesaler_id,
        title: "Payment Received",
        message: `Payment of ${payment.amount.toFixed(2)} for order #${orderId.slice(0, 8)} has been received.`,
        type: "payment",
        reference_id: orderId,
      })
    }

    return {
      success: true,
      orderId,
      paymentId,
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment verification failed",
    }
  }
}

function verifyRazorpayPayment(
  payment: any,
  gatewayPaymentId?: string,
  signature?: string,
  responseData?: any,
): boolean {
  try {
    if (!gatewayPaymentId || !signature || !responseData || !responseData.razorpay_order_id) {
      return false
    }

    // Verify signature
    const text = `${responseData.razorpay_order_id}|${gatewayPaymentId}`
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(text)
      .digest("hex")

    return expectedSignature === signature
  } catch (error) {
    console.error("Razorpay verification error:", error)
    return false
  }
}

function verifyPaytmPayment(payment: any, gatewayPaymentId?: string, responseData?: any): boolean {
  try {
    if (!gatewayPaymentId || !responseData || !responseData.ORDERID || !responseData.STATUS) {
      return false
    }

    // For Paytm, we check if the STATUS is "TXN_SUCCESS"
    return responseData.STATUS === "TXN_SUCCESS"
  } catch (error) {
    console.error("Paytm verification error:", error)
    return false
  }
}

function verifyPhonePePayment(payment: any, gatewayPaymentId?: string, responseData?: any): boolean {
  try {
    if (!gatewayPaymentId || !responseData || !responseData.merchantId || !responseData.transactionId) {
      return false
    }

    // For PhonePe, we would typically verify the checksum
    // This is a simplified version
    return responseData.code === "PAYMENT_SUCCESS"
  } catch (error) {
    console.error("PhonePe verification error:", error)
    return false
  }
}

function verifyPayUPayment(payment: any, gatewayPaymentId?: string, responseData?: any): boolean {
  try {
    if (!gatewayPaymentId || !responseData || !responseData.status || !responseData.hash) {
      return false
    }

    // For PayU, we check if the status is "success" and verify the hash
    // This is a simplified version
    return responseData.status === "success"
  } catch (error) {
    console.error("PayU verification error:", error)
    return false
  }
}

export async function createPaymentIntent(
  orderId: string,
  gateway: string,
  amount: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    // Create payment record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    const { data: payment, error: paymentError } = await supabase.from("payments").insert({
      id: paymentId,
      order_id: orderId,
      amount: amount || order.total_amount,
      currency: "INR",
      gateway,
      status: "pending",
      customer_id: order.retailer_id,
      customer_name: order.retailer_name,
      customer_email: order.retailer_email,
      customer_phone: order.retailer_phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (paymentError) {
      throw paymentError
    }

    // Create payment intent based on gateway
    let paymentIntent
    switch (gateway) {
      case "razorpay":
        paymentIntent = await createRazorpayIntent(orderId, paymentId, amount || order.total_amount)
        break

      case "paytm":
        paymentIntent = await createPaytmIntent(orderId, paymentId, amount || order.total_amount)
        break

      case "phonepe":
        paymentIntent = await createPhonePeIntent(orderId, paymentId, amount || order.total_amount)
        break

      case "payu":
        paymentIntent = await createPayUIntent(orderId, paymentId, amount || order.total_amount)
        break

      case "cod":
        paymentIntent = {
          success: true,
          data: {
            paymentId,
            orderId,
            amount: amount || order.total_amount,
            currency: "INR",
            gateway: "cod",
          },
        }
        break

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`)
    }

    if (!paymentIntent.success) {
      throw new Error(paymentIntent.error || "Failed to create payment intent")
    }

    // Update payment record with gateway-specific details
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_details: paymentIntent.data,
      })
      .eq("id", paymentId)

    if (updateError) {
      throw updateError
    }

    return {
      success: true,
      data: {
        ...paymentIntent.data,
        paymentId,
      },
    }
  } catch (error) {
    console.error("Create payment intent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    }
  }
}

async function createRazorpayIntent(
  orderId: string,
  paymentId: string,
  amount: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // In a real implementation, you would call the Razorpay API
    // This is a simplified version
    return {
      success: true,
      data: {
        id: `rzp_${Date.now()}`,
        amount: amount * 100, // Razorpay uses paise
        currency: "INR",
        orderId,
        paymentId,
        key: process.env.RAZORPAY_KEY_ID,
      },
    }
  } catch (error) {
    console.error("Razorpay intent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Razorpay intent",
    }
  }
}

async function createPaytmIntent(
  orderId: string,
  paymentId: string,
  amount: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // In a real implementation, you would call the Paytm API
    // This is a simplified version
    return {
      success: true,
      data: {
        mid: process.env.PAYTM_MERCHANT_ID,
        orderId,
        paymentId,
        amount: amount.toString(),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/paytm`,
      },
    }
  } catch (error) {
    console.error("Paytm intent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Paytm intent",
    }
  }
}

async function createPhonePeIntent(
  orderId: string,
  paymentId: string,
  amount: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // In a real implementation, you would call the PhonePe API
    // This is a simplified version
    return {
      success: true,
      data: {
        merchantId: process.env.PHONEPE_MERCHANT_ID,
        merchantTransactionId: paymentId,
        amount: amount * 100, // PhonePe uses paise
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/phonepe`,
        orderId,
        paymentId,
      },
    }
  } catch (error) {
    console.error("PhonePe intent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create PhonePe intent",
    }
  }
}

async function createPayUIntent(
  orderId: string,
  paymentId: string,
  amount: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // In a real implementation, you would call the PayU API
    // This is a simplified version
    const txnId = `${paymentId}_${Date.now()}`
    const hashString = `${process.env.PAYU_MERCHANT_KEY}|${txnId}|${amount}|${orderId}|${paymentId}|${process.env.PAYU_MERCHANT_SALT}`

    return {
      success: true,
      data: {
        key: process.env.PAYU_MERCHANT_KEY,
        txnid: txnId,
        amount: amount.toString(),
        productinfo: "Order payment",
        firstname: "Customer",
        email: "customer@example.com",
        phone: "9999999999",
        surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/payu/success`,
        furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/payu/failure`,
        hash: "dummy_hash", // In a real implementation, this would be a calculated hash
        udf1: orderId,
        udf2: paymentId,
      },
    }
  } catch (error) {
    console.error("PayU intent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create PayU intent",
    }
  }
}

export async function initiatePayment(
  gateway: PaymentGateway,
  amount: number,
  orderId: string,
  user: User,
  callbackUrl: string,
): Promise<PaymentInitiationResponse> {
  switch (gateway) {
    case "razorpay":
      return initiateRazorpayPayment(amount, orderId, user, callbackUrl)
    case "paytm":
      return initiatePaytmPayment(amount, orderId, user, callbackUrl)
    case "phonepe":
      return initiatePhonePePayment(amount, orderId, user, callbackUrl)
    case "payu":
      return initiatePayUPayment(amount, orderId, user, callbackUrl)
    default:
      return {
        success: false,
        error: "Unsupported payment gateway",
      }
  }
}

async function initiateRazorpayPayment(
  amount: number,
  orderId: string,
  user: User,
  callbackUrl: string,
): Promise<PaymentInitiationResponse> {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured")
    }

    // Create order in Razorpay
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: orderId,
        notes: {
          order_id: orderId,
          user_id: user.id,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.description || "Failed to create Razorpay order")
    }

    const data = await response.json()

    return {
      success: true,
      redirectUrl: `https://checkout.razorpay.com/v1/checkout.js`,
      formData: {
        key: keyId,
        amount: String(data.amount),
        currency: data.currency,
        name: "Retail Bandhu",
        order_id: data.id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          order_id: orderId,
          user_id: user.id,
        },
        theme: {
          color: "#3399cc",
        },
        callback_url: callbackUrl,
      },
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("Razorpay payment initiation error:", error)
    return {
      success: false,
      error: error.message || "Failed to initiate Razorpay payment",
    }
  }
}

async function initiatePaytmPayment(
  amount: number,
  orderId: string,
  user: User,
  callbackUrl: string,
): Promise<PaymentInitiationResponse> {
  try {
    const merchantId = process.env.PAYTM_MERCHANT_ID
    const merchantKey = process.env.PAYTM_MERCHANT_KEY

    if (!merchantId || !merchantKey) {
      throw new Error("Paytm credentials not configured")
    }

    const transactionId = uuidv4()
    const checksumPayload = {
      mid: merchantId,
      orderId: orderId,
      txnAmount: {
        value: amount.toFixed(2),
        currency: "INR",
      },
      websiteName: "WEBSTAGING", // Replace with your website name
      callbackUrl: callbackUrl,
      txnId: transactionId,
    }

    const generateChecksum = async (payload: any, key: string) => {
      const stringifiedPayload = JSON.stringify(payload)
      const salt = uuidv4()
      const saltedString = stringifiedPayload + "|" + salt
      const checksum = createHmac("sha256", key).update(saltedString).digest("hex")
      return checksum + salt
    }

    const checksum = await generateChecksum(checksumPayload, merchantKey)

    const formData = {
      mid: merchantId,
      orderId: orderId,
      txnAmount: amount.toFixed(2),
      websiteName: "WEBSTAGING", // Replace with your website name
      callbackUrl: callbackUrl,
      checksum: checksum,
      email: user.email,
      mobileNo: user.phone,
      txnId: transactionId,
    }

    return {
      success: true,
      formAction: "https://securegw-stage.paytm.in/order/process", // Use production URL in production
      formData: formData,
      method: "POST",
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("Paytm payment initiation error:", error)
    return {
      success: false,
      error: error.message || "Failed to initiate Paytm payment",
    }
  }
}

async function initiatePhonePePayment(
  amount: number,
  orderId: string,
  user: User,
  callbackUrl: string,
): Promise<PaymentInitiationResponse> {
  try {
    const merchantId = process.env.PHONEPE_MERCHANT_ID
    const saltKey = process.env.PHONEPE_SALT_KEY
    const saltIndex = process.env.PHONEPE_SALT_INDEX

    if (!merchantId || !saltKey || !saltIndex) {
      throw new Error("PhonePe credentials not configured")
    }

    const transactionId = uuidv4()
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      amount: amount * 100, // Amount in paisa
      redirectUrl: callbackUrl,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: user.phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    }

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64")
    const stringForHash = base64Payload + saltKey + saltIndex
    const sha256Hash = createHmac("sha256", saltKey).update(stringForHash).digest("hex")
    const finalXHeader = sha256Hash + "###" + saltIndex

    const apiUrl = "https://api-preprod.phonepe.net/apis/pg-sandbox/pg/v1/pay" // Use production URL in production

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": finalXHeader,
      },
      body: JSON.stringify({ request: base64Payload }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to initiate PhonePe payment")
    }

    const responseData = await response.json()

    if (responseData.success !== true) {
      throw new Error(responseData.message || "PhonePe payment initiation failed")
    }

    const redirectUrl = responseData.data.instrumentResponse.redirectInfo.url

    return {
      success: true,
      redirectUrl: redirectUrl,
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("PhonePe payment initiation error:", error)
    return {
      success: false,
      error: error.message || "Failed to initiate PhonePe payment",
    }
  }
}

async function initiatePayUPayment(
  amount: number,
  orderId: string,
  user: User,
  callbackUrl: string,
): Promise<PaymentInitiationResponse> {
  try {
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      throw new Error("PayU credentials not configured")
    }

    const transactionId = uuidv4()
    const productInfo = "Product Info" // Replace with your product info
    const firstName = user.name
    const email = user.email
    const phone = user.phone

    const hashString = `${merchantKey}|${transactionId}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${merchantSalt}`
    const hash = createHmac("sha512", merchantSalt).update(hashString).digest("hex")

    const formData = {
      key: merchantKey,
      txnid: transactionId,
      amount: amount.toFixed(2),
      productinfo: productInfo,
      firstname: firstName,
      email: email,
      phone: phone,
      surl: callbackUrl,
      furl: callbackUrl,
      hash: hash,
    }

    return {
      success: true,
      formAction: "https://test.payu.in/_payment", // Use production URL in production
      formData: formData,
      method: "POST",
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("PayU payment initiation error:", error)
    return {
      success: false,
      error: error.message || "Failed to initiate PayU payment",
    }
  }
}
