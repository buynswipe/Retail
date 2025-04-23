import { supabase } from "./supabase-client"
import type { Order } from "./supabase-client"

/**
 * Get orders by retailer
 */
export async function getOrdersByRetailer(retailerId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Orders")
      .select("*, OrderItems(*)", { count: "exact" })
      .eq("retailer_id", retailerId)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching retailer orders:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Alias for getOrdersByRetailer
 */
export async function getRetailerOrders(retailerId: string, options = { limit: 50, offset: 0 }) {
  return getOrdersByRetailer(retailerId, options)
}

/**
 * Get orders by wholesaler
 */
export async function getOrdersByWholesaler(wholesalerId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Orders")
      .select("*, OrderItems(*)", { count: "exact" })
      .eq("wholesaler_id", wholesalerId)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching wholesaler orders:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Alias for getOrdersByWholesaler
 */
export async function getWholesalerOrders(wholesalerId: string, options = { limit: 50, offset: 0 }) {
  return getOrdersByWholesaler(wholesalerId, options)
}

/**
 * Get an order by ID
 */
export async function getOrderById(orderId: string) {
  try {
    const { data, error } = await supabase.from("Orders").select("*, OrderItems(*)").eq("id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { data: null, error }
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, "id" | "created_at">, orderItems: any[]) {
  try {
    // Start a transaction
    const { data: orderData, error: orderError } = await supabase
      .from("Orders")
      .insert({
        ...order,
        status: order.status || "pending",
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Add order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: orderData.id,
    }))

    const { error: itemsError } = await supabase.from("OrderItems").insert(orderItemsWithOrderId)

    if (itemsError) throw itemsError

    return { data: orderData, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase.from("Orders").update({ status }).eq("id", orderId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { data: null, error }
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, reason: string) {
  try {
    const { data, error } = await supabase
      .from("Orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error cancelling order:", error)
    return { data: null, error }
  }
}

/**
 * Get order statistics
 */
export async function getOrderStatistics(userId: string, role: string) {
  try {
    const roleField = role === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get total orders
    const { count: totalCount } = await supabase
      .from("Orders")
      .select("*", { count: "exact", head: true })
      .eq(roleField, userId)

    // Get pending orders
    const { count: pendingCount } = await supabase
      .from("Orders")
      .select("*", { count: "exact", head: true })
      .eq(roleField, userId)
      .eq("status", "pending")

    // Get completed orders
    const { count: completedCount } = await supabase
      .from("Orders")
      .select("*", { count: "exact", head: true })
      .eq(roleField, userId)
      .eq("status", "completed")

    // Get cancelled orders
    const { count: cancelledCount } = await supabase
      .from("Orders")
      .select("*", { count: "exact", head: true })
      .eq(roleField, userId)
      .eq("status", "cancelled")

    return {
      totalCount: totalCount || 0,
      pendingCount: pendingCount || 0,
      completedCount: completedCount || 0,
      cancelledCount: cancelledCount || 0,
    }
  } catch (error) {
    console.error("Error fetching order statistics:", error)
    return {
      totalCount: 0,
      pendingCount: 0,
      completedCount: 0,
      cancelledCount: 0,
    }
  }
}
