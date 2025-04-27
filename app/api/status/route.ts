import { NextResponse } from "next/server"
import { getSystemStatus, logStatusCheck } from "@/lib/status-service"

export async function GET() {
  try {
    const status = await getSystemStatus()

    // Log the status check for historical tracking
    await logStatusCheck(status)

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error in status API:", error)
    return NextResponse.json({ error: "Failed to retrieve system status" }, { status: 500 })
  }
}
