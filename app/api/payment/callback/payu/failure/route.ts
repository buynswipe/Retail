import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { updatePaymentStatus } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract PayU response parameters
    const txnid = formData.get("txnid") as string
    const status = formData.get("status") as string
    const error_Message = formData.get("error_Message") as string
    const mihpayid = formData.get("mihpayid") as string

    if (!txnid) {
      return NextResponse.json({ error: "Transaction ID not found" }, { status: 400 })
    }

    // Update payment status in database
    const supabase = createClient()

    // Log the failure
    await supabase.from("payment_logs").insert({
      transaction_id: txnid,
      gateway: "payu",
      status: "failed",
      gateway_response: JSON.stringify(Object.fromEntries(formData)),
      error_message: error_Message || "Payment failed",
    })

    // Update the payment status
    await updatePaymentStatus(txnid, "failed", {
      gateway_transaction_id: mihpayid,
      error_message: error_Message || "Payment failed",
    })

    // Redirect to error page with information
    const redirectUrl = new URL("/payment/error", request.nextUrl.origin)
    redirectUrl.searchParams.set("txnid", txnid)
    redirectUrl.searchParams.set("error", encodeURIComponent(error_Message || "Payment failed"))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("PayU failure callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
