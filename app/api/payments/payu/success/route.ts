import { type NextRequest, NextResponse } from "next/server"
import { verifyPayuHash } from "@/lib/payu"
import { updateOrderPaymentStatus } from "@/lib/order"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData()

    // Convert FormData to a regular object
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Extract necessary parameters
    const { txnid, status, amount, udf1: orderId } = params

    // Verify the hash to ensure the response is authentic
    const isValid = verifyPayuHash(params)

    if (!isValid) {
      console.error("Invalid hash in PayU success callback")
      return NextResponse.redirect(new URL("/retailer/payment-failure?reason=invalid_hash", request.url))
    }

    // Verify transaction ID from cookies
    const storedTxnId = cookies().get("payu_txn")?.value

    if (storedTxnId && storedTxnId !== txnid) {
      console.error("Transaction ID mismatch in PayU success callback")
      return NextResponse.redirect(new URL("/retailer/payment-failure?reason=txn_mismatch", request.url))
    }

    // Clear the transaction cookie
    cookies().delete("payu_txn")

    // Update payment status in database
    if (orderId) {
      await updateOrderPaymentStatus(orderId, "completed", {
        transactionId: txnid,
        amount: Number.parseFloat(amount),
        paymentMethod: "payu",
        paymentDetails: params,
      })
    }

    // Redirect to success page
    return NextResponse.redirect(new URL(`/retailer/payment-success?orderId=${orderId}&txnId=${txnid}`, request.url))
  } catch (error) {
    console.error("Error processing PayU success callback:", error)
    return NextResponse.redirect(new URL("/retailer/payment-failure?reason=server_error", request.url))
  }
}
