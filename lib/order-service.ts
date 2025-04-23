import { supabase } from "./supabase-client"
import type { Product } from "./product-service"

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

export interface Order {
  id: string
  order_number: string
  retailer_id: string
  wholesaler_id: string
  total_amount: number
  status: "placed" | "confirmed" | "rejected" | "dispatched" | "delivered"
  payment_method: "cod" | "upi"
  payment_status: "pending" | "completed"
  commission: number
  commission_gst: number
  delivery_charge: number
  delivery_charge_gst: number
  wholesaler_payout: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
  retailer_name?: string
  wholesaler_name?: string
}

export interface CreateOrderData {
  retailer_id: string
  wholesaler_id: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
  payment_method: "cod" | "upi"
}

// Get platform settings for calculating commissions and charges
async function getPlatformSettings() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching platform settings:", error)
    // Default values if settings can't be fetched
    return {
      commission_percentage: 2,
      commission_gst_rate: 18,
      delivery_charge: 50,
      delivery_gst_rate: 18,
    }
  }

  return data
}

// Generate a unique order number
function generateOrderNumber() {
  const timestamp = new Date().getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${timestamp}${random}`
}

// Create a new order
export async function createOrder(orderData: CreateOrderData): Promise<{ data: Order | null; error: any }> {
  try {
    // Get platform settings for commission calculation
    const settings = await getPlatformSettings()

    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0)

    // Calculate commission and GST
    const commission = (totalAmount * settings.commission_percentage) / 100
    const commissionGst = (commission * settings.commission_gst_rate) / 100

    // Calculate delivery charge and GST
    const deliveryCharge = settings.delivery_charge
    const deliveryChargeGst = (deliveryCharge * settings.delivery_gst_rate) / 100

    // Calculate wholesaler payout
    const wholesalerPayout = totalAmount - commission - commissionGst

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order in database
    const { data: orderResult, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        retailer_id: orderData.retailer_id,
        wholesaler_id: orderData.wholesaler_id,
        total_amount: totalAmount,
        status: "placed",
        payment_method: orderData.payment_method,
        payment_status: "pending",
        commission: commission,
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
    const orderItems = orderData.items.map((item) => ({
      order_id: orderResult.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      return { data: null, error: itemsError }
    }

    return { data: orderResult, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

// Get orders by retailer ID
export async function getOrdersByRetailer(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price
        ),
        wholesaler:users!wholesaler_id(name, business_name)
      `,
      )
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    // Format the data to match our interface
    const formattedData = data.map((order) => ({
      ...order,
      wholesaler_name: order.wholesaler.business_name || order.wholesaler.name,
    }))

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error fetching retailer orders:", error)
    return { data: null, error }
  }
}

// Get orders by wholesaler ID
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price
        ),
        retailer:users!retailer_id(name, business_name)
      `,
      )
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    // Format the data to match our interface
    const formattedData = data.map((order) => ({
      ...order,
      retailer_name: order.retailer.business_name || order.retailer.name,
    }))

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error fetching wholesaler orders:", error)
    return { data: null, error }
  }
}

// Get order details by ID
export async function getOrderById(orderId: string): Promise<{ data: Order | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product:products(id, name, description, image_url)
        ),
        retailer:users!retailer_id(id, name, business_name, phone_number),
        wholesaler:users!wholesaler_id(id, name, business_name, phone_number)
      `,
      )
      .eq("id", orderId)
      .single()

    if (error) {
      return { data: null, error }
    }

    // Format the data to match our interface
    const formattedData = {
      ...data,
      retailer_name: data.retailer.business_name || data.retailer.name,
      wholesaler_name: data.wholesaler.business_name || data.wholesaler.name,
    }

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error fetching order details:", error)
    return { data: null, error }
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: "confirmed" | "rejected" | "dispatched" | "delivered",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error }
  }
}

// Update payment status
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "completed",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}
