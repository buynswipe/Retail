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

    const { txnid, status, mihpayid, amount, productinfo, firstname, email } = params

    // Extract order ID from txnid (assuming format: orderId_timestamp)
    const orderId = txnid.split("_")[0]

    // Verify the hash
    const isValid = verifyPayuHash(params, process.env.PAYU_MERCHANT_SALT!)

    if (!isValid) {
      console.error("Invalid PayU hash in success callback")
      return NextResponse.redirect(
        new URL(`/retailer/payment-failure?orderId=${orderId}&reason=invalid_hash`, request.url),
      )
    }

    if (status === "success") {
      // Update order payment status
      await updateOrderPaymentStatus(orderId, "completed", mihpayid, {
        gateway: "payu",
        amount,
        productinfo,
        firstname,
        email,
        txnid,
        mihpayid,
        status,
      })

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/retailer/payment-success?orderId=${orderId}&txnId=${mihpayid}`, request.url),
      )
    } else {
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
      })

      // Redirect to failure page
      return NextResponse.redirect(
        new URL(`/retailer/payment-failure?orderId=${orderId}&reason=payment_failed`, request.url),
      )
    }
  } catch (error) {
    console.error("Error processing PayU success callback:", error)
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

  const { txnid, status, mihpayid } = params

  // Extract order ID from txnid
  const orderId = txnid?.split("_")[0] || "unknown"

  if (status === "success") {
    // Verify the hash
    const isValid = verifyPayuHash(params, process.env.PAYU_MERCHANT_SALT!)

    if (!isValid) {
      console.error("Invalid PayU hash in success GET callback")
      return NextResponse.redirect(
        new URL(`/retailer/payment-failure?orderId=${orderId}&reason=invalid_hash`, request.url),
      )
    }

    // Update order payment status
    await updateOrderPaymentStatus(orderId, "completed", mihpayid, params)

    // Redirect to success page
    return NextResponse.redirect(new URL(`/retailer/payment-success?orderId=${orderId}&txnId=${mihpayid}`, request.url))
  } else {
    // Update order payment status to failed
    await updateOrderPaymentStatus(orderId, "failed", mihpayid, params)

    // Redirect to failure page
    return NextResponse.redirect(
      new URL(`/retailer/payment-failure?orderId=${orderId}&reason=payment_failed`, request.url),
    )
  }
}
