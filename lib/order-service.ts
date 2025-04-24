import { supabase } from "@/lib/supabase-client"

// Get orders by retailer ID
export async function getOrdersByRetailer(retailerId: string): Promise<{ data: any[] | null; error: any }> {
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
        wholesaler:users!wholesaler_id(id, name, business_name)
      `,
      )
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    // Transform data to include wholesaler name
    const transformedData = data?.map((order) => ({
      ...order,
      wholesaler_name: order.wholesaler?.business_name || order.wholesaler?.name,
    }))

    return { data: transformedData, error }
  } catch (error) {
    console.error("Error getting orders by retailer:", error)
    return { data: null, error }
  }
}

// Get orders by wholesaler ID
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: any[] | null; error: any }> {
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
        retailer:users!retailer_id(id, name, business_name)
      `,
      )
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    // Transform data to include retailer name
    const transformedData = data?.map((order) => ({
      ...order,
      retailer_name: order.retailer?.business_name || order.retailer?.name,
    }))

    return { data: transformedData, error }
  } catch (error) {
    console.error("Error getting orders by wholesaler:", error)
    return { data: null, error }
  }
}

// Add these missing exports after the existing functions

// Get order by ID
export async function getOrderById(orderId: string): Promise<{ data: any | null; error: any }> {
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
          product:products(*)
        ),
        retailer:users!retailer_id(id, name, business_name, phone_number, pin_code),
        wholesaler:users!wholesaler_id(id, name, business_name, phone_number, pin_code)
      `,
      )
      .eq("id", orderId)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error getting order by ID:", error)
    return { data: null, error }
  }
}

// Create a new order
export async function createOrder(orderData: {
  retailer_id: string
  wholesaler_id: string
  payment_method: "cod" | "upi"
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}): Promise<{ data: any | null; error: any }> {
  try {
    // Get platform settings for commission and delivery charges
    const { data: settings, error: settingsError } = await supabase
      .from("platform_settings")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single()

    if (settingsError) {
      console.error("Error fetching platform settings:", settingsError)
      return { data: null, error: settingsError }
    }

    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0)

    // Calculate commission and delivery charges
    const commission = (totalAmount * settings.commission_percentage) / 100
    const commissionGst = (commission * settings.commission_gst_rate) / 100
    const deliveryCharge = settings.delivery_charge
    const deliveryChargeGst = (deliveryCharge * settings.delivery_gst_rate) / 100

    // Calculate wholesaler payout
    const wholesalerPayout = totalAmount - commission - commissionGst

    // Generate order number
    const orderNumber = `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        retailer_id: orderData.retailer_id,
        wholesaler_id: orderData.wholesaler_id,
        total_amount: totalAmount,
        status: "placed",
        payment_method: orderData.payment_method,
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
      console.error("Error creating order:", orderError)
      return { data: null, error: orderError }
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
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
      console.error("Error creating delivery assignment:", assignmentError)
      return { data: null, error: assignmentError }
    }

    return { data: order, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
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
