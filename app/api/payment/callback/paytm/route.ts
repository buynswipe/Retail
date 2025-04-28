import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { updatePaymentStatus } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract Paytm response parameters
    const orderId = formData.get("ORDERID") as string
    const txnId = formData.get("TXNID") as string
    const txnAmount = formData.get("TXNAMOUNT") as string
    const status = formData.get("STATUS") as string
    const responseCode = formData.get("RESPCODE") as string
    const responseMsg = formData.get("RESPMSG") as string
    const checksum = formData.get("CHECKSUMHASH") as string

    if (!orderId || !status) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    // For production, you would verify the checksum here
    // This is a simplified version

    // Update payment status in database
    const supabase = createClient()

    // Log the transaction
    await supabase.from("payment_logs").insert({
      transaction_id: orderId,
      gateway: "paytm",
      status: status.toLowerCase(),
      gateway_response: JSON.stringify(Object.fromEntries(formData)),
      amount: Number.parseFloat(txnAmount),
      gateway_transaction_id: txnId,
    })

    if (status === "TXN_SUCCESS" && responseCode === "01") {
      // Update the payment status to completed
      await updatePaymentStatus(orderId, "completed", {
        gateway_transaction_id: txnId,
        amount: Number.parseFloat(txnAmount),
      })

      // Redirect to success page
      const redirectUrl = new URL("/retailer/orders", request.nextUrl.origin)
      redirectUrl.searchParams.set("payment", "success")
      redirectUrl.searchParams.set("txnid", orderId)

      return NextResponse.redirect(redirectUrl)
    } else {
      // Update the payment status to failed
      await updatePaymentStatus(orderId, "failed", {
        gateway_transaction_id: txnId,
        error_message: responseMsg || "Transaction failed",
      })

      // Redirect to error page
      const redirectUrl = new URL("/payment/error", request.nextUrl.origin)
      redirectUrl.searchParams.set("txnid", orderId)
      redirectUrl.searchParams.set("error", encodeURIComponent(responseMsg || "Transaction failed"))

      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error("Paytm callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
