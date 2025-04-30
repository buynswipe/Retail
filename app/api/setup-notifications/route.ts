import { supabase } from "@/lib/supabase-client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if the notification_preferences table exists
    const { error: checkError } = await supabase.from("notification_preferences").select("id").limit(1)

    if (!checkError) {
      // Table exists, return success
      return NextResponse.json({ success: true, message: "Notification preferences table already exists" })
    }

    // Create the notification_preferences table
    const { error } = await supabase.rpc("create_notification_tables")

    if (error) {
      console.error("Error creating notification tables:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Notification tables created successfully" })
  } catch (error) {
    console.error("Error in setup-notifications route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
