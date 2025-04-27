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

    // Query the database for historical data
    const { data, error } = await supabase
      .from("service_status_logs")
      .select("timestamp, response_time, status")
      .eq("service_name", service)
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching status history:", error)
      return NextResponse.json({ error: "Failed to fetch status history" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in status history API:", error)
    return NextResponse.json({ error: "Failed to retrieve status history" }, { status: 500 })
  }
}
