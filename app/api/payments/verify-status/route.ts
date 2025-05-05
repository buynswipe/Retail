import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { errorHandler } from "@/lib/error-handler"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get order payment status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("payment_status, payment_id, gateway_reference")
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order payment status:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: order.payment_status,
      paymentId: order.payment_id,
      gatewayReference: order.gateway_reference,
    })
  } catch (error) {
    return errorHandler(error, "Error verifying payment status", {
      status: 500,
      response: NextResponse.json({ error: "Failed to verify payment status" }, { status: 500 }),
    })
  }
}
