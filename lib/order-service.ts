import { supabase } from "./supabase-client"
import type { Order, OrderItem } from "./supabase-client"

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD-${timestamp}-${random}`
}

// Create a new order
export async function createOrder(
  retailerId: string,
  wholesalerId: string,
  items: Array<{ productId: string; quantity: number; unitPrice: number; totalPrice: number }>,
  totalAmount: number,
  paymentMethod: "cod" | "upi",
): Promise<{ data: Order | null; error: any }> {
  try {
    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single()

    if (settingsError) {
      return { data: null, error: settingsError }
    }

    // Calculate commission and delivery charges
    const commission = (totalAmount * settings.commission_percentage) / 100
    const commissionGst = (commission * settings.commission_gst_rate) / 100
    const deliveryCharge = settings.delivery_charge
    const deliveryChargeGst = (deliveryCharge * settings.delivery_gst_rate) / 100
    const wholesalerPayout = totalAmount - commission - commissionGst

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: generateOrderNumber(),
        retailer_id: retailerId,
        wholesaler_id: wholesalerId,
        total_amount: totalAmount,
        status: "placed",
        payment_method: paymentMethod,
        payment_status: "pending",
        commission,
        commission_gst: commissionGst,
        delivery_charge: deliveryCharge,
        delivery_charge_gst: deliveryChargeGst,
        wholesaler_payout: wholesalerPayout,
      })
      .select()
      .single()

    if (orderError) {
      return { data: null, error: orderError }
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      // Rollback order creation
      await supabase.from("orders").delete().eq("id", order.id)
      return { data: null, error: itemsError }
    }

    // Create delivery assignment
    const { error: assignmentError } = await supabase.from("delivery_assignments").insert({
      order_id: order.id,
      status: "pending",
      delivery_charge: deliveryCharge,
      delivery_charge_gst: deliveryChargeGst,
    })

    if (assignmentError) {
      // Log error but don't rollback (delivery can be assigned later)
      console.error("Error creating delivery assignment:", assignmentError)
    }

    return { data: order, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

// Get orders by retailer ID
export async function getRetailerOrders(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting retailer orders:", error)
    return { data: null, error }
  }
}

// Get orders by wholesaler ID
export async function getWholesalerOrders(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting wholesaler orders:", error)
    return { data: null, error }
  }
}

// Get orders by retailer (alias for getRetailerOrders for compatibility)
export async function getOrdersByRetailer(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
  return getRetailerOrders(retailerId)
}

// Get orders by wholesaler (alias for getWholesalerOrders for compatibility)
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  return getWholesalerOrders(wholesalerId)
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<{ data: Order | null; error: any }> {
  try {
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting order:", error)
    return { data: null, error }
  }
}

// Get order items by order ID
export async function getOrderItems(orderId: string): Promise<{ data: OrderItem[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId)

    return { data, error }
  } catch (error) {
    console.error("Error getting order items:", error)
    return { data: null, error }
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: "confirmed" | "rejected" | "dispatched" | "delivered",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error }
  }
}
