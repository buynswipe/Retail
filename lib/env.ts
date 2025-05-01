/**
 * Environment variable validation and access
 */

// Define required environment variables with types
const envSchema = {
  // Database
  POSTGRES_URL: { required: true },
  POSTGRES_PRISMA_URL: { required: true },
  POSTGRES_URL_NON_POOLING: { required: false },

  // Supabase
  SUPABASE_URL: { required: true },
  SUPABASE_ANON_KEY: { required: true },
  SUPABASE_SERVICE_ROLE_KEY: { required: true },
  SUPABASE_JWT_SECRET: { required: false },

  // Public URLs
  NEXT_PUBLIC_SUPABASE_URL: { required: true },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true },
  NEXT_PUBLIC_APP_URL: { required: false, default: "http://localhost:3000" },

  // Payment gateways
  RAZORPAY_KEY_ID: { required: false },
  RAZORPAY_KEY_SECRET: { required: false },
  RAZORPAY_WEBHOOK_SECRET: { required: false },
  PAYTM_MERCHANT_ID: { required: false },
  PAYTM_MERCHANT_KEY: { required: false },
  PAYTM_WEBSITE: { required: false },
  PAYTM_INDUSTRY_TYPE: { required: false },
  PAYTM_CHANNEL_ID: { required: false },
  PHONEPE_MERCHANT_ID: { required: false },
  PHONEPE_SALT_KEY: { required: false },
  PHONEPE_SALT_INDEX: { required: false },
  PAYU_MERCHANT_KEY: { required: false },
  PAYU_MERCHANT_SALT: { required: false },

  // Runtime
  NODE_ENV: { required: false, default: "development" },
}

// Validation function
export function validateEnv() {
  const missing: string[] = []

  for (const [key, config] of Object.entries(envSchema)) {
    if (config.required && !process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Missing required environment variables:")
    missing.forEach((key) => {
      console.error(`  - ${key}`)
    })

    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }
  }

  return process.env
}

// Get validated environment
export const env = validateEnv()

// Environment helper functions
export const isProduction = process.env.NODE_ENV === "production"
export const isDevelopment = process.env.NODE_ENV === "development"
export const isTest = process.env.NODE_ENV === "test"

// App URLs
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
