import { type NextRequest, NextResponse } from "next/server"
import { verifyPayUCallback } from "@/lib/payment-service"
import { createClient } from "@/lib/supabase-client"

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

    // Log the webhook event
    const supabase = createClient()
    await supabase.from("payment_webhooks").insert({
      gateway: "payu",
      event_type: params.status || "unknown",
      payload: params,
      processed: result.success,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayU webhook error:", error)

    // Log the error
    const supabase = createClient()
    await supabase.from("payment_webhooks").insert({
      gateway: "payu",
      event_type: "error",
      payload: { error: error instanceof Error ? error.message : "Unknown error" },
      processed: false,
    })

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
