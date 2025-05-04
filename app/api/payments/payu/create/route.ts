import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import crypto from "crypto"

async function generatePaymentParams(
  orderId: string,
  amount: number,
  productInfo: string,
  firstName: string,
  email: string,
  phone: string,
  baseUrl: string,
) {
  const merchantKey = process.env.PAYU_MERCHANT_KEY
  const merchantSalt = process.env.PAYU_MERCHANT_SALT

  if (!merchantKey || !merchantSalt) {
    throw new Error("Payment gateway configuration is missing")
  }

  const txnId = `PAYU_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  const payuPayload = {
    key: merchantKey,
    txnid: txnId,
    amount: amount.toString(),
    productinfo: productInfo,
    firstname: firstName,
    email: email,
    phone: phone,
    surl: `${baseUrl}/api/payments/payu/success`,
    furl: `${baseUrl}/api/payments/payu/failure`,
    udf1: orderId,
  }

  const hashString = `${merchantKey}|${txnId}|${amount}|${payuPayload.productinfo}|${payuPayload.firstname}|${payuPayload.email}|${payuPayload.udf1}||||||||||${merchantSalt}`
  const hash = crypto.createHash("sha512").update(hashString).digest("hex")

  payuPayload.hash = hash

  return { payuPayload, txnId, hash }
}

export async function POST(request: Request) {
  try {
    const { orderId, amount, productInfo, firstName, email, phone } = await request.json()

    // Validate required fields
    if (!orderId || !amount || !productInfo || !firstName || !email || !phone) {
      return Response.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Get the base URL from the request headers
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    // Generate payment parameters including hash
    const paymentParams = await generatePaymentParams(orderId, amount, productInfo, firstName, email, phone, baseUrl)

    const { payuPayload, txnId, hash } = paymentParams

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

    return Response.json({
      success: true,
      id: payment.id,
      txnid: txnId,
      amount: amount,
      hash: hash,
      payuPayload,
      redirectUrl: `${baseUrl}/api/payments/payu/redirect?txnid=${txnId}`,
    })
  } catch (error) {
    console.error("Error creating PayU payment:", error)
    return Response.json({ success: false, error: "Failed to create payment" }, { status: 500 })
  }
}
