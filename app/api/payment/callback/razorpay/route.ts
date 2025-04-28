import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/payment-gateway-integration"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId, orderId } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !paymentId || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(text)
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    // Verify the payment in our system
    const verificationResponse = await verifyPayment({
      gateway: "razorpay",
      orderId,
      paymentId,
      gatewayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      responseData: body,
    })

    if (!verificationResponse.success) {
      return NextResponse.json(
        { success: false, error: verificationResponse.error || "Payment verification failed" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      orderId: verificationResponse.orderId,
      paymentId: verificationResponse.paymentId,
    })
  } catch (error) {
    console.error("Razorpay callback error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
