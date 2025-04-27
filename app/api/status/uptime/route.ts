import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const service = searchParams.get("service")
  const range = searchParams.get("range") || "24h"

  if (!service) {
    return NextResponse.json({ error: "Service parameter is required" }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Calculate the time range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "24h":
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    // Query the database for all logs in the time range
    const { data: allLogs, error: allLogsError } = await supabase
      .from("service_status_logs")
      .select("status")
      .eq("service_name", service)
      .gte("timestamp", startDate.toISOString())

    if (allLogsError) {
      console.error("Error fetching status logs:", allLogsError)
      return NextResponse.json({ error: "Failed to fetch status logs" }, { status: 500 })
    }

    // Query the database for operational logs in the time range
    const { data: operationalLogs, error: operationalLogsError } = await supabase
      .from("service_status_logs")
      .select("status")
      .eq("service_name", service)
      .eq("status", "operational")
      .gte("timestamp", startDate.toISOString())

    if (operationalLogsError) {
      console.error("Error fetching operational logs:", operationalLogsError)
      return NextResponse.json({ error: "Failed to fetch operational logs" }, { status: 500 })
    }

    // Calculate uptime percentage
    const totalLogs = allLogs.length
    const operationalCount = operationalLogs.length

    const uptimePercentage = totalLogs > 0 ? (operationalCount / totalLogs) * 100 : 100

    return NextResponse.json({
      service,
      range,
      uptime: uptimePercentage,
      totalChecks: totalLogs,
      operationalChecks: operationalCount,
    })
  } catch (error) {
    console.error("Error in uptime API:", error)
    return NextResponse.json({ error: "Failed to calculate uptime" }, { status: 500 })
  }
}
