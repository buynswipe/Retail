import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"
import { trackPaymentEvent } from "@/lib/payment-analytics"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    // Get PayU webhook payload
    const payload = await request.json()
    console.log("Received PayU webhook:", JSON.stringify(payload))

    // Verify webhook signature if provided
    const signature = request.headers.get("x-payu-signature")
    if (signature) {
      const isValid = verifyPayUSignature(payload, signature)
      if (!isValid) {
        console.error("Invalid PayU webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Extract payment details from payload
    const {
      txnid,
      mihpayid,
      status,
      amount,
      mode,
      error_Message,
      bank_ref_num,
      udf1, // We store order_id in udf1
      payuMoneyId,
    } = payload

    // Get order ID from udf1 field
    const orderId = udf1

    if (!orderId) {
      console.error("Missing order ID in PayU webhook")
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (paymentError) {
      console.error("Error fetching payment:", paymentError)
      // Create a new payment record if not found
      const { data: newPayment, error: createError } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          amount: Number.parseFloat(amount),
          payment_method: mode.toLowerCase(),
          payment_status: mapPayUStatus(status),
          transaction_id: mihpayid || txnid,
          reference_id: bank_ref_num || payuMoneyId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating payment record:", createError)
        return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
      }

      // Update order payment status
      await updateOrderPaymentStatus(orderId, mapPayUStatus(status), mihpayid || txnid)

      // Track payment event
      await trackPaymentEvent({
        event_type: mapPayUStatus(status) === "completed" ? "payment_completed" : "payment_failed",
        user_id: order.retailer_id,
        order_id: orderId,
        payment_id: newPayment.id,
        payment_method: mode.toLowerCase(),
        amount: Number.parseFloat(amount),
        gateway: "payu",
        metadata: {
          status,
          mihpayid,
          txnid,
          bank_ref_num,
          reason: error_Message || null,
        },
      })

      return NextResponse.json({ success: true, status: "Payment record created" })
    }

    // Update existing payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: mapPayUStatus(status),
        transaction_id: mihpayid || txnid,
        reference_id: bank_ref_num || payuMoneyId || payment.reference_id,
        payment_date: status === "success" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    if (updateError) {
      console.error("Error updating payment record:", updateError)
      return NextResponse.json({ error: "Failed to update payment record" }, { status: 500 })
    }

    // Update order payment status
    await updateOrderPaymentStatus(orderId, mapPayUStatus(status), mihpayid || txnid)

    // Track payment event
    await trackPaymentEvent({
      event_type: mapPayUStatus(status) === "completed" ? "payment_completed" : "payment_failed",
      user_id: order.retailer_id,
      order_id: orderId,
      payment_id: payment.id,
      payment_method: mode.toLowerCase(),
      amount: Number.parseFloat(amount),
      gateway: "payu",
      metadata: {
        status,
        mihpayid,
        txnid,
        bank_ref_num,
        reason: error_Message || null,
      },
    })

    return NextResponse.json({ success: true, status: "Payment record updated" })
  } catch (error) {
    return errorHandler(error, "Error processing PayU webhook", {
      status: 500,
      response: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    })
  }
}

// Helper function to map PayU status to our payment status
function mapPayUStatus(payuStatus: string): "completed" | "pending" | "failed" {
  switch (payuStatus.toLowerCase()) {
    case "success":
      return "completed"
    case "pending":
    case "in progress":
      return "pending"
    case "failure":
    case "failed":
    default:
      return "failed"
  }
}

// Helper function to update order payment status
async function updateOrderPaymentStatus(orderId: string, status: string, transactionId?: string) {
  try {
    await supabase
      .from("orders")
      .update({
        payment_status: status,
        gateway_reference: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
  } catch (error) {
    console.error("Error updating order payment status:", error)
  }
}

// Helper function to verify PayU webhook signature
function verifyPayUSignature(payload: any, signature: string): boolean {
  try {
    // Get PayU salt key from environment variables
    const saltKey = process.env.PAYU_MERCHANT_SALT

    if (!saltKey) {
      console.error("Missing PayU salt key")
      return false
    }

    // Create payload string
    const payloadString = JSON.stringify(payload)

    // Calculate HMAC SHA256 hash
    const hash = crypto.createHmac("sha256", saltKey).update(payloadString).digest("hex")

    // Compare calculated hash with provided signature
    return hash === signature
  } catch (error) {
    console.error("Error verifying PayU signature:", error)
    return false
  }
}
