const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("Build helper script running...")

// Check Node.js version
console.log(`Node.js version: ${process.version}`)

// Check if yarn is available
try {
  const yarnVersion = execSync("yarn --version", { encoding: "utf8" }).trim()
  console.log(`Yarn version: ${yarnVersion}`)
} catch (error) {
  console.error("Yarn is not available:", error.message)
}

// Check package.json
const packageJsonPath = path.join(process.cwd(), "package.json")
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    console.log("Package.json exists with name:", packageJson.name)
  } catch (error) {
    console.error("Error reading package.json:", error.message)
  }
} else {
  console.error("package.json not found!")
}

// Check for lock files
const npmLockExists = fs.existsSync(path.join(process.cwd(), "package-lock.json"))
const yarnLockExists = fs.existsSync(path.join(process.cwd(), "yarn.lock"))
const pnpmLockExists = fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))

console.log("Lock files:")
console.log(`- package-lock.json: ${npmLockExists ? "exists" : "missing"}`)
console.log(`- yarn.lock: ${yarnLockExists ? "exists" : "missing"}`)
console.log(`- pnpm-lock.yaml: ${pnpmLockExists ? "exists" : "missing"}`)

console.log("Build helper script completed.")
