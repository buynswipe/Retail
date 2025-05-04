import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Convert FormData to a regular object
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Redirect to the payment status page with appropriate parameters
    const redirectUrl = new URL("/retailer/payment-status", request.url)

    // Add all parameters to the URL
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, value)
    })

    // Ensure status is set to cancelled
    redirectUrl.searchParams.set("status", "cancelled")

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("PayU cancel callback error:", error)

    // Redirect to payment status page with error
    const redirectUrl = new URL("/retailer/payment-status", request.url)
    redirectUrl.searchParams.append("status", "cancelled")
    redirectUrl.searchParams.append("error", error instanceof Error ? error.message : "Unknown error")

    return NextResponse.redirect(redirectUrl)
  }
}
