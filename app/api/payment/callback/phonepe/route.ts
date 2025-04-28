import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { updatePaymentStatus } from "@/lib/payment-service"
import { createHmac } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Extract PhonePe response parameters
    const { response, merchantId, merchantTransactionId, transactionId } = payload

    if (!merchantTransactionId || !response) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    // Verify the checksum to ensure the response is from PhonePe
    const saltKey = process.env.PHONEPE_SALT_KEY
    const saltIndex = process.env.PHONEPE_SALT_INDEX

    if (!saltKey || !saltIndex) {
      console.error("PhonePe salt not configured")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    // Verify the merchant ID
    const configuredMerchantId = process.env.PHONEPE_MERCHANT_ID
    if (merchantId !== configuredMerchantId) {
      console.error("Merchant ID mismatch")
      return NextResponse.json({ error: "Invalid merchant" }, { status: 400 })
    }

    // Decode the base64 response
    const decodedResponse = Buffer.from(response, "base64").toString("utf-8")
    const responseObj = JSON.parse(decodedResponse)

    // Calculate checksum for verification
    const stringToHash = `/pg/v1/status/${configuredMerchantId}/${merchantTransactionId}${saltKey}`
    const calculatedChecksum = createHmac("sha256", saltKey).update(stringToHash).digest("hex") + "###" + saltIndex

    const receivedChecksum = request.headers.get("X-VERIFY")

    if (receivedChecksum !== calculatedChecksum) {
      console.error("Checksum verification failed")
      return NextResponse.json({ error: "Security verification failed" }, { status: 400 })
    }

    // Process the payment based on the status
    const { code, status, amount } = responseObj.data.paymentDetails
    const amountInRupees = amount / 100 // PhonePe amount is in paise

    // Update payment status in database
    const supabase = createClient()

    // Log the transaction
    await supabase.from("payment_logs").insert({
      transaction_id: merchantTransactionId,
      gateway: "phonepe",
      status: status.toLowerCase(),
      gateway_response: JSON.stringify(responseObj),
      amount: amountInRupees,
      gateway_transaction_id: transactionId,
    })

    if (code === "PAYMENT_SUCCESS" && status === "COMPLETED") {
      // Update the payment status to completed
      await updatePaymentStatus(merchantTransactionId, "completed", {
        gateway_transaction_id: transactionId,
        amount: amountInRupees,
      })

      return NextResponse.json({ status: "success" })
    } else {
      // Update the payment status to failed
      await updatePaymentStatus(merchantTransactionId, "failed", {
        gateway_transaction_id: transactionId,
        error_message: `Payment ${status.toLowerCase()}: ${responseObj.data.responseCodeDescription || "Unknown error"}`,
      })

      return NextResponse.json({ status: "failure" })
    }
  } catch (error) {
    console.error("PhonePe callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
