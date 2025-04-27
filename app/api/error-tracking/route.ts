import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const errorData = await request.json()

    // Validate error data
    if (!errorData.message) {
      return NextResponse.json({ error: "Invalid error data" }, { status: 400 })
    }

    // Store error in database
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("error_logs").insert({
      message: errorData.message,
      stack: errorData.stack || null,
      context: errorData.context || {},
      timestamp: new Date().toISOString(),
      user_agent: request.headers.get("user-agent") || null,
      url: errorData.context?.url || null,
    })

    if (error) {
      console.error("Error storing error log:", error)
      return NextResponse.json({ error: "Failed to store error log" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing error tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
