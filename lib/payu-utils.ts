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

export function generatePayUHash({
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

export function generatePayUResponseHash(params: Record<string, string>, salt: string): string {
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

  return crypto.createHash("sha512").update(hashString).digest("hex")
}

export function verifyPayUResponse(params: Record<string, string>, salt: string): boolean {
  const { hash } = params
  const calculatedHash = generatePayUResponseHash(params, salt)

  return hash === calculatedHash
}

export function generateTransactionId(): string {
  // Generate a unique transaction ID
  return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}
