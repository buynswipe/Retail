import { supabase, createClient } from "./supabase-client"
import { v4 as uuidv4 } from "uuid"
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "./types"
import { createNotification } from "./notification-service"

// Create a new order
export async function createOrder(
  retailerId: string,
  wholesalerId: string,
  items: Array<{ productId: string; quantity: number; unitPrice: number }>,
  shippingAddress: string,
  paymentMethod: string,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const client = createClient()

    // Generate order ID
    const orderId = uuidv4()
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Create order
    const { error: orderError } = await client.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      retailer_id: retailerId,
      wholesaler_id: wholesalerId,
      total_amount: totalAmount,
      status: "placed",
      payment_method: paymentMethod,
      payment_status: "pending",
      shipping_address: shippingAddress,
      created_at: new Date().toISOString(),
    })

    if (orderError) {
      throw orderError
    }

    // Create order items
    const orderItems = items.map((item) => ({
      id: uuidv4(),
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      created_at: new Date().toISOString(),
    }))

    const { error: itemsError } = await client.from("order_items").insert(orderItems)

    if (itemsError) {
      throw itemsError
    }

    // Create notifications
    await createNotification({
      user_id: retailerId,
      title: "Order Placed",
      message: `Your order #${orderNumber} has been placed successfully.`,
      type: "order",
      reference_id: orderId,
    })

    await createNotification({
      user_id: wholesalerId,
      title: "New Order Received",
      message: `You have received a new order #${orderNumber}.`,
      type: "order",
      reference_id: orderId,
    })

    return { success: true, orderId }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create order" }
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<{ data: Order | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        retailer:retailer_id(*),
        wholesaler:wholesaler_id(*),
        items:order_items(*)
      `)
      .eq("id", orderId)
      .single()

    if (error) {
      throw error
    }

    return { data }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { data: null, error: error instanceof Error ? error.message : "Failed to fetch order" }
  }
}

// Get orders by retailer ID
export async function getOrdersByRetailerId(
  retailerId: string,
  limit = 10,
  offset = 0,
  status?: OrderStatus,
): Promise<{ data: Order[]; count: number; error?: string }> {
  try {
    let query = supabase
      .from("orders")
      .select("*, items:order_items(*)", { count: "exact" })
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, count, error } = await query

    if (error) {
      throw error
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("Error fetching retailer orders:", error)
    return { data: [], count: 0, error: error instanceof Error ? error.message : "Failed to fetch orders" }
  }
}

// Get orders by wholesaler ID
export async function getOrdersByWholesalerId(
  wholesalerId: string,
  limit = 10,
  offset = 0,
  status?: OrderStatus,
): Promise<{ data: Order[]; count: number; error?: string }> {
  try {
    let query = supabase
      .from("orders")
      .select("*, items:order_items(*)", { count: "exact" })
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, count, error } = await query

    if (error) {
      throw error
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error("Error fetching wholesaler orders:", error)
    return { data: [], count: 0, error: error instanceof Error ? error.message : "Failed to fetch orders" }
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updatedBy: string,
  role: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient()

    // Get current order
    const { data: order, error: fetchError } = await client
      .from("orders")
      .select("*, retailer:retailer_id(*), wholesaler:wholesaler_id(*)")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      throw fetchError || new Error("Order not found")
    }

    // Update order status
    const { error: updateError } = await client
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      throw updateError
    }

    // Add to status history
    const { error: historyError } = await client.from("order_status_history").insert({
      id: uuidv4(),
      order_id: orderId,
      status,
      updated_by: updatedBy,
      role,
      reason,
      created_at: new Date().toISOString(),
    })

    if (historyError) {
      throw historyError
    }

    // Create notifications
    let retailerMessage = ""
    let wholesalerMessage = ""

    switch (status) {
      case "confirmed":
        retailerMessage = `Your order #${order.order_number} has been confirmed.`
        wholesalerMessage = `You have confirmed order #${order.order_number}.`
        break
      case "processing":
        retailerMessage = `Your order #${order.order_number} is being processed.`
        wholesalerMessage = `Order #${order.order_number} is now being processed.`
        break
      case "shipped":
        retailerMessage = `Your order #${order.order_number} has been shipped.`
        wholesalerMessage = `Order #${order.order_number} has been shipped.`
        break
      case "delivered":
        retailerMessage = `Your order #${order.order_number} has been delivered.`
        wholesalerMessage = `Order #${order.order_number} has been delivered.`
        break
      case "cancelled":
        retailerMessage = `Your order #${order.order_number} has been cancelled.`
        wholesalerMessage = `Order #${order.order_number} has been cancelled.`
        break
      default:
        retailerMessage = `Your order #${order.order_number} status has been updated to ${status}.`
        wholesalerMessage = `Order #${order.order_number} status has been updated to ${status}.`
    }

    await createNotification({
      user_id: order.retailer_id,
      title: "Order Status Updated",
      message: retailerMessage,
      type: "order",
      reference_id: orderId,
    })

    await createNotification({
      user_id: order.wholesaler_id,
      title: "Order Status Updated",
      message: wholesalerMessage,
      type: "order",
      reference_id: orderId,
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update order status" }
  }
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  status: PaymentStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update payment status" }
  }
}

// Get order status history
export async function getOrderStatusHistory(orderId: string): Promise<{ data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return { data: data || [] }
  } catch (error) {
    console.error("Error fetching order status history:", error)
    return { data: [], error: error instanceof Error ? error.message : "Failed to fetch order status history" }
  }
}

// Get order items
export async function getOrderItems(orderId: string): Promise<{ data: OrderItem[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        product:product_id(*)
      `)
      .eq("order_id", orderId)

    if (error) {
      throw error
    }

    return { data: data || [] }
  } catch (error) {
    console.error("Error fetching order items:", error)
    return { data: [], error: error instanceof Error ? error.message : "Failed to fetch order items" }
  }
}

// Add the missing functions
export async function cancelOrder(
  orderId: string,
  cancelledBy: string,
  role: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  return updateOrderStatus(orderId, "cancelled", cancelledBy, role, reason)
}

export const getOrdersByRetailer = getOrdersByRetailerId
export const getRetailerOrders = getOrdersByRetailerId

export const getOrdersByWholesaler = getOrdersByWholesalerId
export const getWholesalerOrders = getOrdersByWholesalerId

export async function getOrderStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{ data: any; error?: string }> {
  try {
    const roleField = role === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get total orders count
    const { count: totalOrders, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq(roleField, userId)

    if (countError) {
      throw countError
    }

    // Get orders by status
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    const ordersByStatus: Record<string, number> = {}

    for (const status of statuses) {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq(roleField, userId)
        .eq("status", status)

      if (error) {
        throw error
      }

      ordersByStatus[status] = count || 0
    }

    // Get total amount for completed orders
    const { data: completedOrders, error: completedError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq(roleField, userId)
      .eq("status", "delivered")

    if (completedError) {
      throw completedError
    }

    const totalAmount = completedOrders.reduce((sum, order) => sum + order.total_amount, 0)

    // Get recent orders
    const { data: recentOrders, error: recentError } = await supabase
      .from("orders")
      .select("*")
      .eq(roleField, userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      throw recentError
    }

    return {
      data: {
        totalOrders,
        ordersByStatus,
        totalAmount,
        recentOrders,
      },
    }
  } catch (error) {
    console.error("Error getting order statistics:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to get order statistics",
    }
  }
}

export async function generateOrderInvoice(orderId: string): Promise<{ data: any; error?: string }> {
  try {
    const { data: order, error: orderError } = await getOrderById(orderId)

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    const { data: items, error: itemsError } = await getOrderItems(orderId)

    if (itemsError) {
      throw itemsError
    }

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      orderNumber: order.order_number,
      date: new Date().toISOString(),
      retailer: order.retailer,
      wholesaler: order.wholesaler,
      items: items,
      subtotal: items.reduce((sum, item) => sum + item.total_price, 0),
      tax: order.tax || 0,
      shippingCost: order.shipping_cost || 0,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    }

    return { data: invoiceData }
  } catch (error) {
    console.error("Error generating invoice:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to generate invoice",
    }
  }
}
