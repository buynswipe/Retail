import { type NextRequest, NextResponse } from "next/server"
import { verifyPayuHash } from "@/lib/payu"
import { updateOrderPaymentStatus } from "@/lib/order"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}

    // Convert FormData to a plain object
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const { txnid, status, mihpayid, error_Message, amount, productinfo, firstname, email } = params

    // Extract order ID from txnid (assuming format: orderId_timestamp)
    const orderId = txnid.split("_")[0]

    // Verify the hash
    const isValid = verifyPayuHash(params, process.env.PAYU_MERCHANT_SALT!)

    if (!isValid) {
      console.error("Invalid PayU hash in failure callback")
      return NextResponse.redirect(
        new URL(`/retailer/payment-failure?orderId=${orderId}&reason=invalid_hash`, request.url),
      )
    }

    // Update order payment status to failed
    await updateOrderPaymentStatus(orderId, "failed", mihpayid, {
      gateway: "payu",
      amount,
      productinfo,
      firstname,
      email,
      txnid,
      mihpayid,
      status,
      error_Message,
    })

    // Redirect to failure page with error message
    const errorReason = encodeURIComponent(error_Message || "Payment failed")
    return NextResponse.redirect(
      new URL(`/retailer/payment-failure?orderId=${orderId}&reason=${errorReason}`, request.url),
    )
  } catch (error) {
    console.error("Error processing PayU failure callback:", error)
    return NextResponse.redirect(new URL("/retailer/payment-failure?reason=server_error", request.url))
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests (redirects from PayU)
  const searchParams = request.nextUrl.searchParams
  const params: Record<string, string> = {}

  // Convert search params to a plain object
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const { txnid, status, mihpayid, error_Message } = params

  // Extract order ID from txnid
  const orderId = txnid?.split("_")[0] || "unknown"

  // Update order payment status to failed
  await updateOrderPaymentStatus(orderId, "failed", mihpayid, params)

  // Redirect to failure page with error message
  const errorReason = encodeURIComponent(error_Message || "Payment failed")
  return NextResponse.redirect(
    new URL(`/retailer/payment-failure?orderId=${orderId}&reason=${errorReason}`, request.url),
  )
}
