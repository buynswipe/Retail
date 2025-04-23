import { supabase, supabaseAdmin, type Order, type OrderItem } from "./supabase-client"

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD-${timestamp}-${random}`
}

// Get all orders
export async function getAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), users!retailer_id(*), users!wholesaler_id(*)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    throw new Error("Failed to fetch orders")
  }

  return data
}

// Get orders for a retailer
export async function getRetailerOrders(retailerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), users!wholesaler_id(name, business_name)")
    .eq("retailer_id", retailerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching retailer orders:", error)
    throw new Error("Failed to fetch retailer orders")
  }

  return data
}

// Alias for getRetailerOrders to match the required export
export const getOrdersByRetailer = getRetailerOrders

// Get orders for a wholesaler
export async function getWholesalerOrders(wholesalerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), users!retailer_id(name, business_name)")
    .eq("wholesaler_id", wholesalerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wholesaler orders:", error)
    throw new Error("Failed to fetch wholesaler orders")
  }

  return data
}

// Alias for getWholesalerOrders to match the required export
export const getOrdersByWholesaler = getWholesalerOrders

// Get a specific order
export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*), users!retailer_id(name, business_name, phone_number), users!wholesaler_id(name, business_name, phone_number)",
    )
    .eq("id", orderId)
    .single()

  if (error) {
    console.error("Error fetching order:", error)
    throw new Error("Failed to fetch order")
  }

  return data
}

// Create a new order
export async function createOrder(
  order: Omit<Order, "id" | "created_at" | "updated_at">,
  orderItems: Omit<OrderItem, "id" | "created_at">[],
) {
  // Start a transaction
  const { data: newOrder, error: orderError } = await supabaseAdmin.from("orders").insert(order).select().single()

  if (orderError) {
    console.error("Error creating order:", orderError)
    throw new Error("Failed to create order")
  }

  // Add order items
  const itemsWithOrderId = orderItems.map((item) => ({
    ...item,
    order_id: newOrder.id,
  }))

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(itemsWithOrderId)

  if (itemsError) {
    console.error("Error creating order items:", itemsError)
    throw new Error("Failed to create order items")
  }

  return { success: true, orderId: newOrder.id }
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
  status: "placed" | "confirmed" | "rejected" | "dispatched" | "delivered",
) {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) {
    console.error("Error updating order status:", error)
    throw new Error("Failed to update order status")
  }

  return { success: true }
}

// Get order statistics
export async function getOrderStatistics(userId: string, userRole: string) {
  let query

  if (userRole === "retailer") {
    query = supabase.from("orders").select("status").eq("retailer_id", userId)
  } else if (userRole === "wholesaler") {
    query = supabase.from("orders").select("status").eq("wholesaler_id", userId)
  } else {
    throw new Error("Invalid user role")
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching order statistics:", error)
    throw new Error("Failed to fetch order statistics")
  }

  const stats = {
    total: data.length,
    placed: data.filter((order) => order.status === "placed").length,
    confirmed: data.filter((order) => order.status === "confirmed").length,
    rejected: data.filter((order) => order.status === "rejected").length,
    dispatched: data.filter((order) => order.status === "dispatched").length,
    delivered: data.filter((order) => order.status === "delivered").length,
  }

  return stats
}
