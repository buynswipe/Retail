"use server"

import { createClient } from "./supabase-client"
import type { PaymentMethod, PaymentStatus } from "./types"
import crypto from "crypto"

// Initialize PayU client
const payu = {
  merchantKey: process.env.PAYU_MERCHANT_KEY || "",
  merchantSalt: process.env.PAYU_MERCHANT_SALT || "",
  merchantSaltVersion: process.env.PAYU_SALT_VERSION || "2",
  baseUrl: process.env.PAYU_BASE_URL || "https://secure.payu.in",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/payment/callback/payu/success`,
  failureUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/payment/callback/payu/failure`,
}

export async function createPaymentOrder(
  orderId: string,
  amount: number,
  currency = "INR",
  paymentMethod: PaymentMethod,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return { success: false, error: orderError?.message || "Order not found" }
    }

    // Get retailer details
    const { data: retailer, error: retailerError } = await supabase
      .from("users")
      .select("email, phone_number, name")
      .eq("id", order.retailer_id)
      .single()

    if (retailerError || !retailer) {
      return { success: false, error: retailerError?.message || "Retailer not found" }
    }

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        amount,
        currency,
        payment_method: paymentMethod,
        status: "pending",
      })
      .select()
      .single()

    if (paymentError || !payment) {
      return { success: false, error: paymentError?.message || "Failed to create payment record" }
    }

    // Create payment order based on selected payment method
    switch (paymentMethod) {
      case "payu":
        return await createPayuOrder(payment.id, amount, currency, order, retailer)
      case "cod":
        return { success: true, data: { paymentId: payment.id, method: "cod" } }
      default:
        return { success: false, error: "Unsupported payment method" }
    }
  } catch (error) {
    console.error("Payment creation error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create payment order" }
  }
}

async function createPayuOrder(
  paymentId: string,
  amount: number,
  currency: string,
  order: any,
  retailer: any,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Generate transaction ID
    const txnId = `TXN_${Date.now()}_${paymentId.substring(0, 8)}`

    // Create PayU payment data
    const payuData = {
      key: payu.merchantKey,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: `Order #${order.id.substring(0, 8)}`,
      firstname: retailer.name || "Customer",
      email: retailer.email || "customer@example.com",
      phone: retailer.phone_number || "",
      surl: payu.successUrl,
      furl: payu.failureUrl,
      udf1: paymentId, // Store payment ID for reference
      udf2: order.id, // Store order ID for reference
    }

    // Generate hash
    const hashString = `${payuData.key}|${payuData.txnid}|${payuData.amount}|${payuData.productinfo}|${
      payuData.firstname
    }|${payuData.email}|${payuData.udf1}|${payuData.udf2}||||||||||${payu.merchantSalt}`

    const hash = crypto.createHash("sha512").update(hashString).digest("hex")

    // Update payment record with transaction ID
    const supabase = createClient()
    await supabase
      .from("payments")
      .update({
        transaction_id: txnId,
        payment_details: { ...payuData, hash },
      })
      .eq("id", paymentId)

    return {
      success: true,
      data: {
        paymentId,
        formData: {
          ...payuData,
          hash,
          service_provider: "payu_paisa",
        },
        formUrl: `${payu.baseUrl}/_payment`,
        method: "payu",
      },
    }
  } catch (error) {
    console.error("PayU order creation error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create PayU order" }
  }
}

export async function verifyPayment(
  paymentMethod: PaymentMethod,
  paymentId: string,
  paymentData: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    let isValid = false

    switch (paymentMethod) {
      case "payu":
        isValid = await verifyPayuPayment(paymentData)
        break
      case "cod":
        isValid = true // COD is always valid at this stage
        break
      default:
        return { success: false, error: "Unsupported payment method" }
    }

    if (!isValid) {
      return { success: false, error: "Payment verification failed" }
    }

    // Update payment status in database
    const { error } = await supabase
      .from("payments")
      .update({
        status: "completed",
        transaction_id: paymentData.txnid || paymentData.mihpayid,
        payment_details: paymentData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Get order ID from payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("order_id")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return { success: false, error: paymentError?.message || "Payment not found" }
    }

    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)

    if (orderError) {
      return { success: false, error: orderError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Payment verification error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to verify payment" }
  }
}

async function verifyPayuPayment(paymentData: any): Promise<boolean> {
  try {
    // Extract data from PayU response
    const { status, txnid, amount, productinfo, firstname, email, udf1, udf2, mihpayid, hash } = paymentData

    // Verify the hash to ensure the response is from PayU
    const calculatedHash = crypto
      .createHash("sha512")
      .update(
        `${payu.merchantSalt}|${status}|||||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${payu.merchantKey}`,
      )
      .digest("hex")

    // Check if the hash matches and status is 'success'
    return calculatedHash === hash && status.toLowerCase() === "success"
  } catch (error) {
    console.error("PayU verification error:", error)
    return false
  }
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  // In a real application, this might come from a database or configuration
  return ["payu", "cod"]
}

export async function getPaymentDetails(paymentId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        orders (*)
      `)
      .eq("id", paymentId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get payment details error:", error)
    return { success: false, error: "Failed to get payment details" }
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("payments")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update payment status error:", error)
    return { success: false, error: "Failed to update payment status" }
  }
}
