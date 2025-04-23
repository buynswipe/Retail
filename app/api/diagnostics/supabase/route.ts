import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Check environment variables
    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
    }

    // Test Supabase connection
    let connectionStatus = "❌ Failed"
    let errorMessage = null
    let tables = []

    try {
      // Simple query to test connection
      const { data, error } = await supabase.from("users").select("count").limit(1)

      if (error) {
        connectionStatus = "❌ Error"
        errorMessage = error.message
      } else {
        connectionStatus = "✅ Connected"

        // Get list of tables if connected
        const { data: tablesData, error: tablesError } = await supabase
          .from("pg_catalog.pg_tables")
          .select("tablename")
          .eq("schemaname", "public")

        if (!tablesError && tablesData) {
          tables = tablesData.map((t) => t.tablename)
        }
      }
    } catch (e) {
      connectionStatus = "❌ Exception"
      errorMessage = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envStatus,
      supabaseConnection: {
        status: connectionStatus,
        error: errorMessage,
        tables: tables.length > 0 ? tables : null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Diagnostic check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
