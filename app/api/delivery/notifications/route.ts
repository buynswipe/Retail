import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"

export async function POST(request: Request) {
  try {
    const { deliveryId, status, message, recipientId, recipientRole } = await request.json()

    if (!deliveryId || !status || !message || !recipientId || !recipientRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create notification in the database
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: recipientId,
        type: "delivery",
        title: `Delivery ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        metadata: { deliveryId, status },
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Get delivery details for the response
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (order_number)
      `)
      .eq("id", deliveryId)
      .single()

    if (deliveryError) {
      throw deliveryError
    }

    return NextResponse.json({
      success: true,
      notification: data,
      delivery,
    })
  } catch (error) {
    errorHandler(error, "Error sending delivery notification")
    return NextResponse.json({ error: "Failed to send delivery notification" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get delivery notifications for the user
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "delivery")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notifications: data,
    })
  } catch (error) {
    errorHandler(error, "Error fetching delivery notifications")
    return NextResponse.json({ error: "Failed to fetch delivery notifications" }, { status: 500 })
  }
}
