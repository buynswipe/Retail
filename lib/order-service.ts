import { supabase } from "./supabase-client"
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "./types"

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
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*),
        retailer:retailer_id(*),
        wholesaler:wholesaler_id(*)
      `)
      .order("created_at", { ascending: false })

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
        items:order_items(*, product:product_id(*)),
        wholesaler:wholesaler_id(name, business_name)
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
        items:order_items(*, product:product_id(*)),
        retailer:retailer_id(name, business_name, phone_number)
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
        items:order_items(*, product:product_id(*)),
        retailer:retailer_id(name, business_name, phone_number, pin_code),
        wholesaler:wholesaler_id(name, business_name, phone_number)
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
export async function createOrder(orderData: {
  retailer_id: string
  wholesaler_id: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
  payment_method: PaymentMethod
}): Promise<{ data: Order | null; error: any }> {
  try {
    // Calculate order totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.total_price, 0)
    const commission = subtotal * 0.02 // 2% commission
    const commission_gst = commission * 0.18 // 18% GST on commission
    const delivery_charge = 50 // Fixed delivery charge
    const delivery_charge_gst = delivery_charge * 0.18 // 18% GST on delivery charge
    const total_amount = subtotal + delivery_charge + delivery_charge_gst
    const wholesaler_payout = subtotal - commission - commission_gst

    // Create the order
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: generateOrderNumber(),
        retailer_id: orderData.retailer_id,
        wholesaler_id: orderData.wholesaler_id,
        total_amount,
        status: "placed" as OrderStatus,
        payment_method: orderData.payment_method,
        payment_status: "pending" as PaymentStatus,
        commission,
        commission_gst,
        delivery_charge,
        delivery_charge_gst,
        wholesaler_payout,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return { data: null, error }
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      // If there's an error with items, delete the order to maintain consistency
      await supabase.from("orders").delete().eq("id", data.id)
      return { data: null, error: itemsError }
    }

    // Update product stock quantities
    for (const item of orderData.items) {
      const { error: stockError } = await supabase.rpc("decrease_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })

      if (stockError) {
        console.error("Error updating product stock:", stockError)
        // Continue with the order even if stock update fails
        // In a production app, you might want to handle this differently
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
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

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  transactionId?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      console.error("Error updating payment status:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Get order statistics
export async function getOrderStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{
  data: {
    total_orders: number
    pending_orders: number
    completed_orders: number
    total_amount: number
    recent_orders: Order[]
  } | null
  error: any
}> {
  try {
    // Get total orders
    const { count: total_orders, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)

    if (countError) {
      console.error("Error getting order count:", countError)
      return { data: null, error: countError }
    }

    // Get pending orders
    const { count: pending_orders, error: pendingError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .in("status", ["placed", "confirmed", "dispatched"])

    if (pendingError) {
      console.error("Error getting pending order count:", pendingError)
      return { data: null, error: pendingError }
    }

    // Get completed orders
    const { count: completed_orders, error: completedError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .eq("status", "delivered")

    if (completedError) {
      console.error("Error getting completed order count:", completedError)
      return { data: null, error: completedError }
    }

    // Get total amount
    const { data: amountData, error: amountError } = await supabase.rpc("get_user_total_order_amount", {
      p_user_id: userId,
      p_role: role,
    })

    if (amountError) {
      console.error("Error getting total order amount:", amountError)
      return { data: null, error: amountError }
    }

    // Get recent orders
    const { data: recentOrders, error: recentError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*, product:product_id(*)),
        ${role === "retailer" ? "wholesaler:wholesaler_id(name, business_name)" : "retailer:retailer_id(name, business_name)"}
      `)
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      console.error("Error getting recent orders:", recentError)
      return { data: null, error: recentError }
    }

    return {
      data: {
        total_orders: total_orders || 0,
        pending_orders: pending_orders || 0,
        completed_orders: completed_orders || 0,
        total_amount: amountData || 0,
        recent_orders: recentOrders || [],
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting order statistics:", error)
    return { data: null, error }
  }
}
