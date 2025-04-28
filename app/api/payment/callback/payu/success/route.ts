import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { updatePaymentStatus } from "@/lib/payment-service"
import { createHmac } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract PayU response parameters
    const txnid = formData.get("txnid") as string
    const status = formData.get("status") as string
    const amount = formData.get("amount") as string
    const productinfo = formData.get("productinfo") as string
    const firstname = formData.get("firstname") as string
    const email = formData.get("email") as string
    const mihpayid = formData.get("mihpayid") as string
    const hash = formData.get("hash") as string

    if (!txnid || !hash) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    // Verify the hash to ensure the response is from PayU
    const salt = process.env.PAYU_MERCHANT_SALT
    if (!salt) {
      console.error("PayU salt not configured")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const key = process.env.PAYU_MERCHANT_KEY

    // Calculate hash for verification
    // Format: sha512(salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const hashString = `${salt}|${status}|||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
    const calculatedHash = createHmac("sha512", salt).update(hashString).digest("hex")

    if (hash !== calculatedHash) {
      console.error("Hash verification failed")
      return NextResponse.json({ error: "Security verification failed" }, { status: 400 })
    }

    // Update payment status in database
    const supabase = createClient()

    // Log the success
    await supabase.from("payment_logs").insert({
      transaction_id: txnid,
      gateway: "payu",
      status: "success",
      gateway_response: JSON.stringify(Object.fromEntries(formData)),
      amount: Number.parseFloat(amount),
    })

    // Update the payment status
    await updatePaymentStatus(txnid, "completed", {
      gateway_transaction_id: mihpayid,
      amount: Number.parseFloat(amount),
    })

    // Redirect to success page
    const redirectUrl = new URL("/retailer/orders", request.nextUrl.origin)
    redirectUrl.searchParams.set("payment", "success")
    redirectUrl.searchParams.set("txnid", txnid)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("PayU success callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
