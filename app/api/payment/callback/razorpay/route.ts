import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { updatePaymentStatus } from "@/lib/payment-service"
import { createHmac } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Extract Razorpay webhook payload
    const { event, payload: eventPayload } = payload

    if (!event || !eventPayload) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Verify the webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("Razorpay webhook secret not configured")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const signature = request.headers.get("x-razorpay-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Calculate signature for verification
    const calculatedSignature = createHmac("sha256", webhookSecret).update(JSON.stringify(payload)).digest("hex")

    if (signature !== calculatedSignature) {
      console.error("Signature verification failed")
      return NextResponse.json({ error: "Security verification failed" }, { status: 400 })
    }

    // Process based on event type
    if (event === "payment.authorized" || event === "payment.captured") {
      const { payment } = eventPayload
      const { entity } = payment

      const orderId = entity.notes?.order_id
      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in payment notes" }, { status: 400 })
      }

      // Update payment status in database
      const supabase = createClient()

      // Log the transaction
      await supabase.from("payment_logs").insert({
        transaction_id: orderId,
        gateway: "razorpay",
        status: "success",
        gateway_response: JSON.stringify(entity),
        amount: entity.amount / 100, // Razorpay amount is in paise
        gateway_transaction_id: entity.id,
      })

      // Update the payment status to completed
      await updatePaymentStatus(orderId, "completed", {
        gateway_transaction_id: entity.id,
        amount: entity.amount / 100,
      })

      return NextResponse.json({ status: "success" })
    } else if (event === "payment.failed") {
      const { payment } = eventPayload
      const { entity } = payment

      const orderId = entity.notes?.order_id
      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in payment notes" }, { status: 400 })
      }

      // Update payment status in database
      const supabase = createClient()

      // Log the transaction
      await supabase.from("payment_logs").insert({
        transaction_id: orderId,
        gateway: "razorpay",
        status: "failed",
        gateway_response: JSON.stringify(entity),
        error_message: entity.error_description || "Payment failed",
      })

      // Update the payment status to failed
      await updatePaymentStatus(orderId, "failed", {
        gateway_transaction_id: entity.id,
        error_message: entity.error_description || "Payment failed",
      })

      return NextResponse.json({ status: "failure acknowledged" })
    }

    // For other events, just acknowledge
    return NextResponse.json({ status: "event acknowledged" })
  } catch (error) {
    console.error("Razorpay webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
