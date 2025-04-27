import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create a server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "lib", "fix-users-rls.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error applying RLS policies:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "RLS policies applied successfully" })
  } catch (error) {
    console.error("Error in setup-rls route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
