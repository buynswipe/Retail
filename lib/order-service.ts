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

// Update the getOrdersByWholesaler function to handle demo user IDs
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  try {
    // Check if this is a demo user ID (non-UUID format)
    if (wholesalerId.startsWith("user-") || !isValidUUID(wholesalerId)) {
      console.log("Using demo orders for demo wholesaler")
      return {
        data: [
          {
            id: "demo-order-1",
            order_number: "ORD12345678",
            retailer_id: "demo-retailer-1",
            wholesaler_id: wholesalerId,
            total_amount: 2500,
            status: "placed",
            payment_method: "online",
            payment_status: "pending",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            items: [
              {
                id: "demo-item-1",
                order_id: "demo-order-1",
                product_id: "demo-product-1",
                quantity: 5,
                unit_price: 500,
                total_price: 2500,
                product: {
                  id: "demo-product-1",
                  name: "Premium Rice",
                  description: "High quality basmati rice",
                  price: 500,
                  stock: 100,
                  wholesaler_id: wholesalerId,
                },
              },
            ],
            retailer: {
              name: "Demo Retailer",
              business_name: "Demo Retail Store",
              phone_number: "9876543210",
            },
          },
        ],
        error: null,
      }
    }

    // First, get the orders for this wholesaler
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        retailer:retailer_id(name, business_name, phone_number)
      `)
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders by wholesaler:", ordersError)
      return { data: null, error: ordersError }
    }

    // If we have orders, get the order items and products separately
    if (orders && orders.length > 0) {
      const orderIds = orders.map((order) => order.id)

      // Get all order items for these orders
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds)

      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        return { data: null, error: itemsError }
      }

      // Get all product IDs from order items
      const productIds = orderItems ? orderItems.map((item) => item.product_id) : []

      // Get all products for these IDs
      const { data: products, error: productsError } = await supabase.from("products").select("*").in("id", productIds)

      if (productsError) {
        console.error("Error fetching products:", productsError)
        return { data: null, error: productsError }
      }

      // Create a map of products by ID for easy lookup
      const productsMap = {}
      if (products) {
        products.forEach((product) => {
          productsMap[product.id] = product
        })
      }

      // Create a map of order items by order ID
      const orderItemsMap = {}
      if (orderItems) {
        orderItems.forEach((item) => {
          if (!orderItemsMap[item.order_id]) {
            orderItemsMap[item.order_id] = []
          }

          // Add product data to order item
          const itemWithProduct = {
            ...item,
            product: productsMap[item.product_id] || null,
          }

          orderItemsMap[item.order_id].push(itemWithProduct)
        })
      }

      // Add items to each order
      const ordersWithItems = orders.map((order) => ({
        ...order,
        items: orderItemsMap[order.id] || [],
      }))

      return { data: ordersWithItems, error: null }
    }

    return { data: orders || [], error: null }
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

// Add a helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
