import { NextResponse } from "next/server"
import crypto from "crypto"
import { supabase } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"

// PayU payment gateway configuration
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || ""
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || ""
const PAYU_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://secure.payu.in/_payment" : "https://sandboxsecure.payu.in/_payment"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, amount, currency, redirectUrl } = body

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, retailer:retailer_id(*)")
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Generate transaction ID
    const txnId = `TXNID${Date.now()}`

    // Create a unique hash for PayU
    const hashString = `${PAYU_MERCHANT_KEY}|${txnId}|${amount}|${order.id}|${order.retailer?.name || "Customer"}|${order.retailer?.email || "customer@example.com"}|${orderId}|${PAYU_MERCHANT_SALT}`
    const hash = crypto.createHash("sha512").update(hashString).digest("hex")

    // Prepare PayU payment data
    const payuData = {
      key: PAYU_MERCHANT_KEY,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: order.id,
      firstname: order.retailer?.name || "Customer",
      email: order.retailer?.email || "customer@example.com",
      udf1: orderId, // Custom field to store our order ID
      surl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/retailer/orders/${orderId}?status=success`,
      furl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/retailer/orders/${orderId}?status=failure`,
      hash: hash,
    }

    // Update order with payment information
    await supabase
      .from("orders")
      .update({
        payment_gateway: "payu",
        payment_status: "pending",
        gateway_reference: txnId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    return NextResponse.json({
      success: true,
      id: txnId,
      payuData,
      payuUrl: PAYU_BASE_URL,
      hash,
    })
  } catch (error) {
    return errorHandler(error, "Error initializing PayU payment", {
      status: 500,
      response: NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 }),
    })
  }
}
