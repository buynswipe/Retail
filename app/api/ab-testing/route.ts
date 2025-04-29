import { NextResponse } from "next/server"
import { assignUserToVariant, trackConversion } from "@/lib/ab-testing"

export async function POST(request: Request) {
  try {
    const { action, testId, userId, sessionId, conversionType, metadata } = await request.json()

    if (action === "assign") {
      const variant = await assignUserToVariant(testId, userId, sessionId)
      return NextResponse.json({ variant })
    } else if (action === "convert") {
      await trackConversion(testId, conversionType, userId, sessionId, metadata)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("AB testing API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
