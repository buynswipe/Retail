import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { logs } = await request.json()

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: "Invalid logs format" }, { status: 400 })
    }

    const supabase = createClient()

    // Insert logs into the database
    const { error } = await supabase.from("system_logs").insert(
      logs.map((log: any) => ({
        level: log.level,
        message: log.message,
        context: log.context,
        user_id: log.userId,
        session_id: log.sessionId,
        timestamp: log.timestamp,
      })),
    )

    if (error) {
      console.error("Error inserting logs:", error)
      return NextResponse.json({ error: "Failed to store logs" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
