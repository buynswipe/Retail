import { type NextRequest, NextResponse } from "next/server"
import { verifyPayUCallback } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Convert FormData to a regular object
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Verify the payment
    const result = await verifyPayUCallback(params)

    // Redirect to the payment status page with appropriate parameters
    const redirectUrl = new URL("/retailer/payment-status", request.url)

    // Add all parameters to the URL
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, value)
    })

    // Add our verification result
    redirectUrl.searchParams.append("verified", result.success.toString())
    if (result.error) {
      redirectUrl.searchParams.append("error", result.error)
    }

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("PayU success callback error:", error)

    // Redirect to payment status page with error
    const redirectUrl = new URL("/retailer/payment-status", request.url)
    redirectUrl.searchParams.append("status", "failure")
    redirectUrl.searchParams.append("error", error instanceof Error ? error.message : "Unknown error")

    return NextResponse.redirect(redirectUrl)
  }
}
