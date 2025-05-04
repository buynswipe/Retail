import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, currency = "INR", metadata = {} } = body

    // Validate request
    if (!orderId || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, retailer:retailer_id(*)")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get PayU configuration
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      return NextResponse.json({ error: "Payment gateway configuration is missing" }, { status: 500 })
    }

    // Generate transaction ID
    const txnId = `PAYU_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Prepare PayU request payload
    const payuPayload = {
      key: merchantKey,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: `Order #${order.order_number}`,
      firstname: order.retailer?.name || "Customer",
      email: order.retailer?.email || "customer@example.com",
      phone: order.retailer?.phone_number || "",
      surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/success`,
      furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/failure`,
      udf1: orderId, // Store order ID for reference
    }

    // Generate hash for PayU
    const hashString = `${merchantKey}|${txnId}|${amount}|${payuPayload.productinfo}|${payuPayload.firstname}|${payuPayload.email}|${payuPayload.udf1}||||||||||${merchantSalt}`
    const hash = crypto.createHash("sha512").update(hashString).digest("hex")

    payuPayload.hash = hash

    // Create a payment record in our database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        amount: amount,
        payment_method: "upi",
        payment_status: "pending",
        transaction_id: txnId,
        reference_id: `PAYUREF_${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    // Return PayU payment details
    return NextResponse.json({
      success: true,
      id: payment.id,
      txnid: txnId,
      amount: amount,
      hash: hash,
      payuPayload,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payu/redirect?txnid=${txnId}`,
    })
  } catch (error) {
    return errorHandler(error, "Failed to initialize PayU payment", { status: 500 })
  }
}
