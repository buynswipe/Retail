import { type NextRequest, NextResponse } from "next/server"
import { verifyPayuHash } from "@/lib/payu"
import { updateOrderPaymentStatus } from "@/lib/order"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}

    // Convert FormData to a plain object
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const { txnid, status, mihpayid, amount, productinfo, firstname, email } = params

    // Extract order ID from txnid (assuming format: orderId_timestamp)
    const orderId = txnid.split("_")[0]

    // Verify the hash
    const isValid = verifyPayuHash(params, process.env.PAYU_MERCHANT_SALT!)

    if (!isValid) {
      console.error("Invalid PayU hash in webhook")
      return NextResponse.json({ success: false, error: "Invalid hash" }, { status: 400 })
    }

    // Log the webhook event
    await supabase.from("payment_webhooks").insert({
      gateway: "payu",
      event_type: status,
      payload: params,
      order_id: orderId,
      transaction_id: mihpayid,
      created_at: new Date().toISOString(),
    })

    // Update order payment status based on the webhook status
    if (status === "success") {
      await updateOrderPaymentStatus(orderId, "completed", mihpayid, {
        gateway: "payu",
        amount,
        productinfo,
        firstname,
        email,
        txnid,
        mihpayid,
        status,
        webhook: true,
      })
    } else if (status === "failure") {
      await updateOrderPaymentStatus(orderId, "failed", mihpayid, {
        gateway: "payu",
        amount,
        productinfo,
        firstname,
        email,
        txnid,
        mihpayid,
        status,
        webhook: true,
      })
    } else {
      await updateOrderPaymentStatus(orderId, "pending", mihpayid, {
        gateway: "payu",
        amount,
        productinfo,
        firstname,
        email,
        txnid,
        mihpayid,
        status,
        webhook: true,
      })
    }

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing PayU webhook:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
