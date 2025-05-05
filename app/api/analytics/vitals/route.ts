import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, metrics } = body

    if (!type || !metrics) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert into appropriate table based on metric type
    let tableName

    switch (type) {
      case "navigation":
        tableName = "performance_navigation"
        break
      case "lcp":
        tableName = "performance_lcp"
        break
      case "fid":
        tableName = "performance_fid"
        break
      case "cls":
        tableName = "performance_cls"
        break
      case "resource":
        tableName = "performance_resources"
        break
      case "long_task":
        tableName = "performance_long_tasks"
        break
      case "memory":
        tableName = "performance_memory"
        break
      default:
        tableName = "performance_other"
    }

    const { error } = await supabase.from(tableName).insert(metrics)

    if (error) {
      console.error(`Error storing ${type} metrics:`, error)
      return NextResponse.json({ error: "Failed to store metrics" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in vitals API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
