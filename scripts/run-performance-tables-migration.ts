import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function runMigration() {
  // Read environment variables
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "lib", "performance-tables.sql")
    const sql = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error executing SQL migration:", error)
      process.exit(1)
    }

    console.log("Performance tables migration completed successfully")
  } catch (error) {
    console.error("Error running migration:", error)
    process.exit(1)
  }
}

runMigration()
