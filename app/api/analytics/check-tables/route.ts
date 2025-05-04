import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  try {
    // List of tables to check
    const tables = [
      "performance_logs",
      "performance_navigation",
      "performance_lcp",
      "performance_fid",
      "performance_cls",
      "performance_resources",
      "performance_long_tasks",
      "performance_memory",
      "performance_other",
    ]

    const results = {}

    // Check each table
    for (const table of tables) {
      try {
        const { error, count } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(0)

        results[table] = {
          exists: !error,
          count: count || 0,
          error: error ? error.message : null,
        }
      } catch (err) {
        results[table] = {
          exists: false,
          count: 0,
          error: err.message,
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: results,
    })
  } catch (error) {
    console.error("Error checking performance tables:", error)
    return NextResponse.json({ error: "Failed to check tables" }, { status: 500 })
  }
}
