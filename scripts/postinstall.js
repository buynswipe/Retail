const fs = require("fs")
const path = require("path")

console.log("Running postinstall script to fix potential issues...")

// Function to recursively find node_modules directories
function findNodeModulesDirs(dir, nodeModulesDirs = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") {
        nodeModulesDirs.push(fullPath)
      } else if (!fullPath.includes("node_modules")) {
        // Only recurse into directories that aren't inside node_modules
        findNodeModulesDirs(fullPath, nodeModulesDirs)
      }
    }
  }

  return nodeModulesDirs
}

// Fix package.json files that might cause issues
function fixPackageJsonFiles(nodeModulesDirs) {
  for (const dir of nodeModulesDirs) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const packageJsonPath = path.join(dir, entry.name, "package.json")

        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

            // Fix potential issues in package.json
            let modified = false

            // Remove problematic fields if they exist
            const fieldsToRemove = ["engines", "engineStrict", "cpu", "os", "preferGlobal"]
            for (const field of fieldsToRemove) {
              if (packageJson[field]) {
                delete packageJson[field]
                modified = true
              }
            }

            if (modified) {
              fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
              console.log(`Fixed package.json in ${packageJsonPath}`)
            }
          } catch (error) {
            console.error(`Error processing ${packageJsonPath}:`, error.message)
          }
        }
      }
    }
  }
}

try {
  const nodeModulesDirs = findNodeModulesDirs(process.cwd())
  fixPackageJsonFiles(nodeModulesDirs)
  console.log("Postinstall script completed successfully.")
} catch (error) {
  console.error("Error in postinstall script:", error.message)
}
