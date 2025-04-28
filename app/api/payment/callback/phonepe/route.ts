import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/payment-gateway-integration"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, transactionId, merchantTransactionId, amount, paymentId, orderId } = body

    if (!merchantId || !transactionId || !merchantTransactionId || !amount || !paymentId || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Verify the payment in our system
    const verificationResponse = await verifyPayment({
      gateway: "phonepe",
      orderId,
      paymentId,
      gatewayPaymentId: transactionId,
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
    console.error("PhonePe callback error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
