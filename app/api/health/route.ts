import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase.from("health_check").select("*").limit(1)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Get app version from version.json if available
    let version = "unknown"
    try {
      const versionInfo = await fetch(new URL("/version.json", process.env.NEXT_PUBLIC_APP_URL)).then((res) =>
        res.json(),
      )
      version = versionInfo.version || "unknown"
    } catch (e) {
      console.error("Failed to load version info", e)
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version,
      environment: process.env.NODE_ENV || "production",
      database: "connected",
    })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
