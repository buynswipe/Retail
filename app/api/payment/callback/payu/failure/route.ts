import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const responseData: Record<string, any> = {}

    // Convert FormData to object
    for (const [key, value] of body.entries()) {
      responseData[key] = value
    }

    const { txnid, mihpayid, error, udf1 } = responseData
    const orderId = udf1

    // Redirect to failure page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/retailer/checkout/payment?orderId=${orderId}&payment=failed&error=${
        error || "Payment failed"
      }`,
    )
  } catch (error) {
    console.error("PayU failure callback error:", error)
    const orderId = request.nextUrl.searchParams.get("udf1") || ""
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/retailer/checkout/payment?orderId=${orderId}&payment=failed&error=Internal server error`,
    )
  }
}
