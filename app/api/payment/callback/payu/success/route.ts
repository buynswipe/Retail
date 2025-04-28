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

    const { txnid, mihpayid, status, hash, udf1, udf2 } = responseData
    const orderId = udf1
    const paymentId = udf2

    if (!txnid || !mihpayid || !status || !hash || !orderId || !paymentId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/retailer/checkout/payment?orderId=${orderId}&payment=failed&error=Missing required parameters`,
      )
    }

    // Verify the payment in our system
    const verificationResponse = await verifyPayment({
      gateway: "payu",
      orderId,
      paymentId,
      gatewayPaymentId: mihpayid,
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
    console.error("PayU success callback error:", error)
    const orderId = request.nextUrl.searchParams.get("udf1") || ""
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/retailer/checkout/payment?orderId=${orderId}&payment=failed&error=Internal server error`,
    )
  }
}
