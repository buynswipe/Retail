import crypto from "crypto"

/**
 * Verifies the PayU hash received in the response
 * @param params The parameters received from PayU
 * @param salt The merchant salt key
 * @returns Boolean indicating if the hash is valid
 */
export function verifyPayuHash(params: Record<string, string>, salt: string): boolean {
  const { hash } = params

  if (!hash) {
    return false
  }

  // Response hash sequence for success: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const {
    status,
    udf5 = "",
    udf4 = "",
    udf3 = "",
    udf2 = "",
    udf1 = "",
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  } = params

  const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
  const calculatedHash = crypto.createHash("sha512").update(hashString).digest("hex")

  return hash === calculatedHash
}

/**
 * Generates a PayU hash for payment request
 * @param params The parameters for hash generation
 * @param salt The merchant salt key
 * @returns The generated hash
 */
export function generatePayuHash(params: {
  key: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  salt: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}): string {
  const {
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
  } = params

  // PayU hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`

  return crypto.createHash("sha512").update(hashString).digest("hex")
}

/**
 * Generates a unique transaction ID for PayU
 * @returns A unique transaction ID
 */
export function generatePayuTransactionId(): string {
  return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}
