import { supabase } from "./supabase-client"
import type { Order } from "./types"

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = new Date().getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${timestamp}${random}`
}

// Get all orders
export async function getAllOrders(): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { data: null, error }
  }
}

// Get orders by retailer
export async function getOrdersByRetailer(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders by retailer:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching orders by retailer:", error)
    return { data: null, error }
  }
}

// Get orders by wholesaler
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        retailer:retailer_id(name, business_name)
      `)
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders by wholesaler:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching orders by wholesaler:", error)
    return { data: null, error }
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<{ data: Order | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*),
        retailer:retailer_id(name, business_name)
      `)
      .eq("id", orderId)
      .single()

    if (error) {
      console.error("Error fetching order by ID:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching order by ID:", error)
    return { data: null, error }
  }
}

// Create a new order
export async function createOrder(order: {
  retailer_id: string
  wholesaler_id: string
  items: { product_id: string; quantity: number; unit_price: number; total_price: number }[]
  payment_method: string
}): Promise<{ data: Order | null; error: any }> {
  try {
    const total_amount = order.items.reduce((acc, item) => acc + item.total_price, 0)
    const commission = total_amount * 0.02 // 2% commission
    const commission_gst = commission * 0.18 // 18% GST on commission
    const delivery_charge = 50 // Fixed delivery charge
    const delivery_charge_gst = delivery_charge * 0.18 // 18% GST on delivery charge
    const wholesaler_payout = total_amount - commission - commission_gst - delivery_charge - delivery_charge_gst

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          order_number: generateOrderNumber(),
          retailer_id: order.retailer_id,
          wholesaler_id: order.wholesaler_id,
          total_amount: total_amount + delivery_charge + delivery_charge_gst,
          status: "placed",
          payment_method: order.payment_method,
          payment_status: "pending",
          commission: commission,
          commission_gst: commission_gst,
          delivery_charge: delivery_charge,
          delivery_charge_gst: delivery_charge_gst,
          wholesaler_payout: wholesaler_payout,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return { data: null, error }
    }

    // Create order items
    const orderItems = order.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems)

    if (orderItemsError) {
      console.error("Error creating order items:", orderItemsError)
      return { data: null, error: orderItemsError }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      console.error("Error updating order status:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error }
  }
}
