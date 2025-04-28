import { type NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/payment-gateway-integration"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const responseData: Record<string, any> = {}

    // Convert FormData to object
    for (const [key, value] of body.entries()) {
      responseData[key] = value
    }

    const { ORDERID, TXNID, STATUS, paymentId, orderId } = responseData

    if (!ORDERID || !TXNID || !STATUS || !paymentId || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Verify the payment in our system
    const verificationResponse = await verifyPayment({
      gateway: "paytm",
      orderId,
      paymentId,
      gatewayPaymentId: TXNID,
      responseData,
    })

    if (!verificationResponse.success) {
      // Redirect to failure page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/retailer/checkout/payment?orderId=${orderId}&payment=failed&error=${
          verificationResponse.error || "Payment verification failed"
        }`,
      )
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/retailer/orders/${orderId}?payment=success`)
  } catch (error) {
    console.error("Paytm callback error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
