import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, metrics } = body

    if (!type || !metrics) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate metrics data
    if (typeof metrics !== "object") {
      return NextResponse.json({ error: "Invalid metrics format" }, { status: 400 })
    }

    // Sanitize metrics to ensure they match the expected schema
    const sanitizedMetrics = sanitizeMetrics(metrics, type)

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

    // Check if table exists before inserting
    const { error: tableCheckError, data: tableExists } = await supabase
      .from(tableName)
      .select("count(*)")
      .limit(1)
      .single()
      .catch(() => ({ error: true, data: null }))

    // If table doesn't exist, create a log entry instead
    if (tableCheckError || !tableExists) {
      console.warn(`Table ${tableName} does not exist or is not accessible. Logging metrics instead.`)

      // Log metrics to performance_logs table as fallback
      const { error: logError } = await supabase
        .from("performance_logs")
        .insert({
          metric_type: type,
          metric_data: sanitizedMetrics,
          created_at: new Date().toISOString(),
        })
        .catch((err) => ({ error: err }))

      if (logError) {
        console.error(`Error logging ${type} metrics to fallback table:`, logError)
        return NextResponse.json({ error: "Failed to store metrics in logs" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Metrics logged to fallback table" })
    }

    // Insert metrics into the appropriate table
    const { error } = await supabase
      .from(tableName)
      .insert(sanitizedMetrics)
      .catch((err) => ({ error: err }))

    if (error) {
      console.error(`Error storing ${type} metrics:`, error)

      // Try to log to fallback table
      await supabase
        .from("performance_logs")
        .insert({
          metric_type: type,
          metric_data: sanitizedMetrics,
          created_at: new Date().toISOString(),
          error_message: error.message,
        })
        .catch((err) => console.error("Failed to log to fallback table:", err))

      return NextResponse.json({ error: `Failed to store ${type} metrics` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in vitals API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to sanitize metrics based on type
function sanitizeMetrics(metrics: any, type: string) {
  // Create a copy to avoid modifying the original
  const sanitized = { ...metrics }

  // Ensure timestamp exists
  if (!sanitized.timestamp) {
    sanitized.timestamp = new Date().toISOString()
  }

  // Ensure page exists
  if (!sanitized.page) {
    sanitized.page = "unknown"
  }

  // Truncate long strings
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string" && sanitized[key].length > 500) {
      sanitized[key] = sanitized[key].substring(0, 500)
    }
  }

  // Type-specific sanitization
  switch (type) {
    case "resource":
      // Truncate resource URLs if too long
      if (sanitized.resource_url && sanitized.resource_url.length > 500) {
        sanitized.resource_url = sanitized.resource_url.substring(0, 500)
      }
      break
    case "long_task":
      // Ensure duration is a number
      if (typeof sanitized.duration !== "number") {
        sanitized.duration = Number.parseFloat(sanitized.duration) || 0
      }
      break
    // Add more type-specific sanitization as needed
  }

  return sanitized
}
