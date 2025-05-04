"use server"

import { generatePayuHash } from "@/lib/payu"
import { cookies } from "next/headers"

export async function initializePayuPayment(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const productInfo = formData.get("productInfo") as string
    const firstName = formData.get("firstName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const origin = formData.get("origin") as string

    if (!orderId || !amount || !productInfo || !firstName || !email || !phone) {
      return { success: false, error: "Missing required parameters" }
    }

    // Generate a unique transaction ID
    const txnid = `TXN_${orderId.substring(0, 8)}_${Date.now()}`

    // Get the merchant key from environment (server-side only)
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      return { success: false, error: "Payment gateway configuration is missing" }
    }

    // Prepare payment data
    const paymentData = {
      key: merchantKey,
      txnid,
      amount: amount.toString(),
      productinfo: productInfo,
      firstname: firstName,
      email,
      phone,
      surl: `${origin}/api/payments/payu/success`,
      furl: `${origin}/api/payments/payu/failure`,
      curl: `${origin}/retailer/checkout?cancelled=true`,
      udf1: orderId, // Store order ID for reference
    }

    // Generate hash
    const hash = generatePayuHash({
      key: merchantKey,
      txnid,
      amount: amount.toString(),
      productinfo: productInfo,
      firstname: firstName,
      email,
      udf1: orderId,
      salt: merchantSalt,
    })

    // Store transaction info in cookies for verification later
    cookies().set("payu_txn", txnid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour
      path: "/",
    })

    return {
      success: true,
      paymentData: {
        ...paymentData,
        hash,
      },
      paymentUrl:
        process.env.NODE_ENV === "production" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment",
    }
  } catch (error) {
    console.error("Error initializing PayU payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize payment",
    }
  }
}
