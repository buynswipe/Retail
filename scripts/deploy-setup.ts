import fs from "fs"
import path from "path"
import { execSync } from "child_process"

/**
 * Pre-deployment script to prepare the application
 */
async function deploySetup() {
  try {
    console.log("🚀 Starting deployment preparation...")

    // Verify environment variables
    verifyRequiredEnvVars()

    // Build database schema validation
    await buildDbSchemaValidation()

    // Generate service worker
    await generateServiceWorker()

    // Update version info
    await updateVersionInfo()

    console.log("✅ Deployment preparation complete!")
  } catch (error) {
    console.error("❌ Deployment preparation failed:", error)
    process.exit(1)
  }
}

function verifyRequiredEnvVars() {
  console.log("📋 Verifying required environment variables...")
  const requiredVars = [
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  console.log("✅ All required environment variables are present")
}

async function buildDbSchemaValidation() {
  console.log("🔄 Building database schema validation...")
  // Combine SQL files for deployment
  const sqlDir = path.join(process.cwd(), "lib")
  const sqlFiles = [
    "supabase-schema.sql",
    "supabase-triggers.sql",
    "analytics-functions.sql",
    "retailer-wholesaler-analytics-functions.sql",
    "user-flow-schema.sql",
    "user-flow-functions.sql",
    "notification-schema.sql",
    "notification-procedures.sql",
    "admin-rls-policies.sql",
    "chat-presence-schema.sql",
  ]

  let combinedSql = "-- Combined SQL schema for Retail Bandhu\n\n"

  for (const file of sqlFiles) {
    const filePath = path.join(sqlDir, file)
    if (fs.existsSync(filePath)) {
      console.log(`Including SQL file: ${file}`)
      const content = fs.readFileSync(filePath, "utf8")
      combinedSql += `-- Source: ${file}\n${content}\n\n`
    }
  }

  fs.writeFileSync(path.join(process.cwd(), "deployment/combined-schema.sql"), combinedSql)
  console.log("✅ Combined SQL schema created")
}

async function generateServiceWorker() {
  console.log("🔄 Optimizing service worker...")

  // Create deployment directory if it doesn't exist
  const deploymentDir = path.join(process.cwd(), "deployment")
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir)
  }

  // Read the current service worker
  const swPath = path.join(process.cwd(), "public/sw.js")
  let swContent = fs.readFileSync(swPath, "utf8")

  // Add version info and timestamp
  const version = `retail-bandhu-v${Date.now()}`
  swContent = swContent.replace(/const CACHE_NAME = "retail-bandhu-v1"/, `const CACHE_NAME = "${version}"`)

  // Add more assets to precache
  const additionalAssets = [
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/sounds/notification-default.mp3",
    "/placeholder.png",
  ]

  // Insert additional assets into PRECACHE_ASSETS array
  const precachePattern = /const PRECACHE_ASSETS = \[([\s\S]*?)\]/
  const precacheMatch = swContent.match(precachePattern)

  if (precacheMatch) {
    const currentAssets = precacheMatch[1]
    const newAssets = currentAssets + ",\n  " + additionalAssets.map((asset) => `"${asset}"`).join(",\n  ")
    swContent = swContent.replace(precachePattern, `const PRECACHE_ASSETS = [${newAssets}]`)
  }

  // Write updated service worker
  fs.writeFileSync(path.join(process.cwd(), "public/sw.js"), swContent)
  console.log("✅ Service worker optimized")
}

async function updateVersionInfo() {
  console.log("🔄 Updating version info...")

  // Get git commit info if available
  let commitHash = "development"
  const buildDate = new Date().toISOString()

  try {
    commitHash = execSync("git rev-parse --short HEAD").toString().trim()
  } catch (error) {
    console.log("No git repository found, using default version")
  }

  // Create version.json
  const versionInfo = {
    version: process.env.npm_package_version || "1.0.0",
    commit: commitHash,
    buildDate,
    environment: process.env.NODE_ENV || "production",
  }

  fs.writeFileSync(path.join(process.cwd(), "public/version.json"), JSON.stringify(versionInfo, null, 2))

  console.log("✅ Version info updated")
}

// Run the setup
deploySetup()
