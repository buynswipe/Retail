import { validateEnv } from "@/lib/env"

// Run validation as early as possible during bootstrap
try {
  validateEnv()
  console.log("✅ Environment validation passed")
} catch (error) {
  console.error("❌ Environment validation failed:", error)
  // In production, we may want to exit the process or handle gracefully
}
