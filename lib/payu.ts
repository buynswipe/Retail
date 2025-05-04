import crypto from "crypto"

interface PayUHashParams {
  key: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  salt: string
}

export function generatePayuHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
  salt,
}: PayUHashParams): string {
  // PayU hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`

  // Generate SHA512 hash
  return crypto.createHash("sha512").update(hashString).digest("hex")
}

export function verifyPayuHash(params: Record<string, string>): boolean {
  const salt = process.env.PAYU_MERCHANT_SALT

  if (!salt) {
    console.error("PayU merchant salt not configured")
    return false
  }

  const { hash, status, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 } = params

  if (!hash) {
    return false
  }

  // For success response: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  // For failure response: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key

  const key = process.env.PAYU_MERCHANT_KEY || ""

  const calculatedHashString = `${salt}|${status}||||||${udf5 || ""}|${udf4 || ""}|${udf3 || ""}|${udf2 || ""}|${udf1 || ""}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`

  const calculatedHash = crypto.createHash("sha512").update(calculatedHashString).digest("hex")

  return hash === calculatedHash
}

export function generatePayuTransactionId(orderId: string): string {
  // Generate a unique transaction ID that includes the order ID prefix
  const prefix = orderId.substring(0, 8)
  return `TXN_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
}
