import { NextResponse } from "next/server"
import crypto from "crypto"
import { errorHandler } from "@/lib/error-handler"
import { updatePaymentStatus } from "@/lib/payment-service"

// PayU payment gateway configuration
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || ""
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || ""

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Extract PayU response parameters
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1, // Our order ID
      mihpayid,
      hash,
    } = body

    // Verify the hash to ensure the response is from PayU
    const calculatedHash = crypto
      .createHash("sha512")
      .update(
        `${PAYU_MERCHANT_SALT}|${status}|${txnid}|${productinfo}|${amount}|${firstname}|${email}|${udf1}|${mihpayid}|${PAYU_MERCHANT_KEY}`,
      )
      .digest("hex")

    const verified = calculatedHash === hash

    if (!verified) {
      console.error("PayU hash verification failed")
      return NextResponse.json({ verified: false, error: "Hash verification failed" }, { status: 400 })
    }

    // Get the order ID from udf1
    const orderId = udf1

    // Update payment status based on PayU response
    const paymentStatus = status === "success" ? "completed" : "failed"

    await updatePaymentStatus(orderId, paymentStatus, {
      paymentId: mihpayid,
      gatewayReference: txnid,
      metadata: body,
    })

    return NextResponse.json({
      verified: true,
      orderId,
      paymentId: mihpayid,
      status: paymentStatus,
    })
  } catch (error) {
    return errorHandler(error, "Error verifying PayU payment", {
      status: 500,
      response: NextResponse.json({ verified: false, error: "Failed to verify payment" }, { status: 500 }),
    })
  }
}
