/**
 * Test script for PayU integration
 *
 * This script simulates a payment flow using PayU to verify the integration is working correctly.
 *
 * Usage:
 * - Run with: npx ts-node scripts/test-payu-integration.ts
 * - Make sure environment variables are set up correctly
 */

import crypto from "crypto"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Configuration
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
  console.error("Error: PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT environment variables must be set")
  process.exit(1)
}

// Generate a test transaction ID
const txnId = `TEST_${Date.now()}`

// Test order details
const testOrder = {
  amount: "100.00",
  productinfo: "Test Product",
  firstname: "Test",
  email: "test@example.com",
  phone: "9999999999",
  udf1: "test-order-id", // Order ID
}

// Generate hash for PayU
function generateHash() {
  const hashString = `${PAYU_MERCHANT_KEY}|${txnId}|${testOrder.amount}|${testOrder.productinfo}|${testOrder.firstname}|${testOrder.email}|${testOrder.udf1}||||||||||${PAYU_MERCHANT_SALT}`
  return crypto.createHash("sha512").update(hashString).digest("hex")
}

// Simulate payment request
async function simulatePaymentRequest() {
  console.log("Simulating payment request to PayU...")

  const hash = generateHash()

  // Prepare request payload
  const payload = {
    key: PAYU_MERCHANT_KEY,
    txnid: txnId,
    amount: testOrder.amount,
    productinfo: testOrder.productinfo,
    firstname: testOrder.firstname,
    email: testOrder.email,
    phone: testOrder.phone,
    surl: `${APP_URL}/api/payments/payu/success`,
    furl: `${APP_URL}/api/payments/payu/failure`,
    udf1: testOrder.udf1,
    hash: hash,
  }

  console.log("Request payload:", payload)

  // In a real scenario, this would be a form submission to PayU
  console.log("In a real scenario, this would redirect to PayU payment page")
  console.log("PayU payment URL: https://secure.payu.in/_payment")

  // Simulate a successful payment response
  simulatePaymentResponse("success")
}

// Simulate payment response
async function simulatePaymentResponse(status: "success" | "failure") {
  console.log(`Simulating ${status} payment response from PayU...`)

  // Prepare response payload
  const responsePayload = {
    key: PAYU_MERCHANT_KEY,
    txnid: txnId,
    amount: testOrder.amount,
    productinfo: testOrder.productinfo,
    firstname: testOrder.firstname,
    email: testOrder.email,
    status: status,
    udf1: testOrder.udf1,
    mihpayid: `PAYUID_${Date.now()}`,
  }

  // Generate response hash
  const hashString = `${PAYU_MERCHANT_SALT}|${status}||||||||||${testOrder.udf1}|${testOrder.email}|${testOrder.firstname}|${testOrder.productinfo}|${testOrder.amount}|${txnId}|${PAYU_MERCHANT_KEY}`
  const hash = crypto.createHash("sha512").update(hashString).digest("hex")

  responsePayload.hash = hash

  console.log("Response payload:", responsePayload)

  // In a real scenario, PayU would POST to our callback URL
  console.log(`In a real scenario, PayU would POST to ${APP_URL}/api/payments/payu/${status}`)

  // Verify the hash calculation is correct
  console.log("Hash verification:")
  console.log("- Hash string:", hashString)
  console.log("- Generated hash:", hash)

  console.log("\nTest completed successfully!")
}

// Run the test
simulatePaymentRequest()
