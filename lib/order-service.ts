import { supabase, supabaseAdmin } from "./supabase-client"
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "./types"

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = new Date().getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD${timestamp}${random}`
}

// Get all orders - ADMIN FUNCTION
export async function getAllOrders(): Promise<{ data: Order[] | null; error: any }> {
  try {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        items:order_items(*),
        retailer:retailer_id(*),
        wholesaler:wholesaler_id(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all orders:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching all orders:", error)
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
/**
 * Get order by ID
 * @param orderId Order ID to get
 * @returns Promise with order data and error if any
 */
export async function getOrderById(orderId: string): Promise<{ data: Order | null; error: any }> {
  try {
    // For demo order IDs, return demo data
    if (orderId.startsWith("demo-")) {
      console.log("Using demo order for demo order ID")

      // Create demo order data
      const demoOrder: Order = {
        id: orderId,
        order_number: orderId === "demo-order-1" ? "ORD12345678" : "ORD87654321",
        retailer_id: "user-retailer-1",
        wholesaler_id: "user-wholesaler-1",
        status: orderId === "demo-order-1" ? "placed" : "confirmed",
        payment_status: "pending",
        total_amount: orderId === "demo-order-1" ? 2500 : 3500,
        subtotal: orderId === "demo-order-1" ? 2300 : 3200,
        delivery_charge: 100,
        delivery_charge_gst: 18,
        commission: 70,
        commission_gst: 12.6,
        wholesaler_payout: orderId === "demo-order-1" ? 2400 : 3350,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            id: `${orderId}-item-1`,
            order_id: orderId,
            product_id: "demo-product-1",
            quantity: 5,
            unit_price: orderId === "demo-order-1" ? 300 : 400,
            total_price: orderId === "demo-order-1" ? 1500 : 2000,
            product: {
              id: "demo-product-1",
              name: "Premium Wheat Flour",
              description: "High-quality wheat flour for all your baking needs",
              price: orderId === "demo-order-1" ? 300 : 400,
              image_url: "/golden-wheat-flour.png",
              category: "Grocery",
              wholesaler_id: "user-wholesaler-1",
              stock_quantity: 100,
              min_order_quantity: 5,
              is_featured: true,
              created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          {
            id: `${orderId}-item-2`,
            order_id: orderId,
            product_id: "demo-product-2",
            quantity: 2,
            unit_price: 400,
            total_price: 800,
            product: {
              id: "demo-product-2",
              name: "Premium Butter",
              description: "Creamy butter for cooking and baking",
              price: 400,
              image_url: "/golden-butter-dish.png",
              category: "Dairy",
              wholesaler_id: "user-wholesaler-1",
              stock_quantity: 50,
              min_order_quantity: 2,
              is_featured: true,
              created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        ],
        retailer: {
          id: "user-retailer-1",
          name: orderId === "demo-order-1" ? "Vikram Singh" : "Suresh Kumar",
          email: orderId === "demo-order-1" ? "vikram@example.com" : "suresh@example.com",
          phone_number: orderId === "demo-order-1" ? "+91 98765 43210" : "+91 87654 32109",
          business_name: orderId === "demo-order-1" ? "Demo Retail Store" : "Another Retail Shop",
          address: "123 Main Street, Mumbai",
          pin_code: "400001",
          gst_number: "27AAPFU0939F1ZV",
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }

      return { data: demoOrder, error: null }
    }

    // For real orders, query the database
    // First get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        retailer:retailer_id(*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return { data: null, error: orderError }
    }

    // Then get the order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("Error fetching order items:", itemsError)
      return { data: order, error: itemsError }
    }

    // Get product details for each order item
    const orderItemsWithProducts: OrderItem[] = []

    for (const item of orderItems) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .single()

      if (productError) {
        console.error(`Error fetching product for item ${item.id}:`, productError)
        orderItemsWithProducts.push(item)
      } else {
        orderItemsWithProducts.push({
          ...item,
          product,
        })
      }
    }

    // Combine order with items
    const orderWithItems: Order = {
      ...order,
      items: orderItemsWithProducts,
    }

    return { data: orderWithItems, error: null }
  } catch (error) {
    console.error("Error fetching order by ID:", error)
    return { data: null, error }
  }
}

// Create a new order
/**
 * Get orders by retailer ID
 * @param retailerId Retailer ID to get orders for
 * @param status Optional status filter
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with orders data, count, and error if any
 */
export async function getOrdersByRetailerId(
  retailerId: string,
  status?: OrderStatus,
  limit = 10,
  offset = 0,
): Promise<{ data: Order[]; count: number; error: any }> {
  try {
    // For demo retailer IDs, return demo data
    if (retailerId.startsWith("user-")) {
      console.log("Using demo orders for demo retailer")
      const demoOrders = [
        {
          id: "demo-order-1",
          order_number: "ORD12345678",
          retailer_id: retailerId,
          wholesaler_id: "user-wholesaler-1",
          status: "placed",
          payment_status: "pending",
          total_amount: 2500,
          subtotal: 2300,
          delivery_charge: 100,
          delivery_charge_gst: 18,
          commission: 70,
          commission_gst: 12.6,
          retailer_total: 2500,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          wholesaler: {
            id: "user-wholesaler-1",
            business_name: "Premium Wholesale Supplies",
            name: "Rajesh Sharma",
            phone_number: "+91 98765 12345",
          },
        },
        {
          id: "demo-order-2",
          order_number: "ORD87654321",
          retailer_id: retailerId,
          wholesaler_id: "user-wholesaler-2",
          status: "confirmed",
          payment_status: "pending",
          total_amount: 3500,
          subtotal: 3200,
          delivery_charge: 200,
          delivery_charge_gst: 36,
          commission: 50,
          commission_gst: 9,
          retailer_total: 3500,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          wholesaler: {
            id: "user-wholesaler-2",
            business_name: "Mega Distributors Ltd",
            name: "Amit Patel",
            phone_number: "+91 87654 98765",
          },
        },
      ]

      // Filter by status if provided
      const filteredOrders = status ? demoOrders.filter((order) => order.status === status) : demoOrders

      return { data: filteredOrders, count: filteredOrders.length, error: null }
    }

    // For real retailers, query the database
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        wholesaler:wholesaler_id(id, business_name, name, phone_number)
      `,
        { count: "exact" },
      )
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status)
    }

    const { data, count, error } = await query

    if (error) {
      console.error("Error fetching orders by retailer ID:", error)
      return { data: [], count: 0, error }
    }

    return { data: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching orders by retailer ID:", error)
    return { data: [], count: 0, error }
  }
}

/**
 * Get orders by wholesaler ID
 * @param wholesalerId Wholesaler ID to get orders for
 * @param status Optional status filter
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with orders data, count, and error if any
 */
export async function getOrdersByWholesalerId(
  wholesalerId: string,
  status?: OrderStatus,
  limit = 10,
  offset = 0,
): Promise<{ data: Order[]; count: number; error: any }> {
  try {
    // For demo wholesaler IDs, return demo data
    if (wholesalerId.startsWith("user-")) {
      console.log("Using demo orders for demo wholesaler")
      const demoOrders = [
        {
          id: "demo-order-1",
          order_number: "ORD12345678",
          retailer_id: "user-retailer-1",
          wholesaler_id: wholesalerId,
          status: "placed",
          payment_status: "pending",
          total_amount: 2500,
          subtotal: 2300,
          delivery_charge: 100,
          delivery_charge_gst: 18,
          commission: 70,
          commission_gst: 12.6,
          wholesaler_payout: 2400,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          retailer: {
            id: "user-retailer-1",
            business_name: "Demo Retail Store",
            name: "Vikram Singh",
            phone_number: "+91 98765 43210",
            pin_code: "400001",
          },
        },
        {
          id: "demo-order-2",
          order_number: "ORD87654321",
          retailer_id: "user-retailer-2",
          wholesaler_id: wholesalerId,
          status: "confirmed",
          payment_status: "pending",
          total_amount: 3500,
          subtotal: 3200,
          delivery_charge: 200,
          delivery_charge_gst: 36,
          commission: 50,
          commission_gst: 9,
          wholesaler_payout: 3350,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          retailer: {
            id: "user-retailer-2",
            business_name: "Another Retail Shop",
            name: "Suresh Kumar",
            phone_number: "+91 87654 32109",
            pin_code: "400002",
          },
        },
      ]

      // Filter by status if provided
      const filteredOrders = status ? demoOrders.filter((order) => order.status === status) : demoOrders

      return { data: filteredOrders, count: filteredOrders.length, error: null }
    }

    // For real wholesalers, query the database
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        retailer:retailer_id(id, business_name, name, phone_number, pin_code)
      `,
        { count: "exact" },
      )
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status)
    }

    const { data, count, error } = await query

    if (error) {
      console.error("Error fetching orders by wholesaler ID:", error)
      return { data: [], count: 0, error }
    }

    return { data: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching orders by wholesaler ID:", error)
    return { data: [], count: 0, error }
  }
}

/**
 * Create a new order
 * @param orderData Order data to create
 * @returns Promise with created order data and error if any
 */
export async function createOrder(orderData: Partial<Order>): Promise<{ data: Order | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        retailer_id: orderData.retailer_id,
        wholesaler_id: orderData.wholesaler_id,
        status: "placed",
        payment_status: "pending",
        total_amount: orderData.total_amount,
        subtotal: orderData.subtotal,
        delivery_charge: orderData.delivery_charge,
        delivery_charge_gst: orderData.delivery_charge_gst,
        commission: orderData.commission,
        commission_gst: orderData.commission_gst,
        wholesaler_payout: orderData.wholesaler_payout,
        order_number: `ORD${Date.now().toString().slice(-8)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

/**
 * Add items to an order
 * @param orderId Order ID to add items to
 * @param items Order items to add
 * @returns Promise with success status and error if any
 */
export async function addOrderItems(
  orderId: string,
  items: Array<{ product_id: string; quantity: number; unit_price: number; total_price: number }>,
): Promise<{ success: boolean; error: any }> {
  try {
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error } = await supabase.from("order_items").insert(orderItems)

    if (error) {
      console.error("Error adding order items:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error adding order items:", error)
    return { success: false, error }
  }
}

/**
 * Update order status
 * @param orderId Order ID to update
 * @param status New order status
 * @returns Promise with success status and error if any
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ success: boolean; error: any }> {
  try {
    // Handle demo order IDs
    if (orderId.startsWith("demo-")) {
      console.log(`Using demo order status update for demo order: ${status}`)
      return { success: true, error: null }
    }

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
/**
 * Get order statistics for a user
 * @param userId User ID to get statistics for
 * @param role User role (retailer or wholesaler)
 * @param timeframe Optional timeframe for statistics
 * @returns Promise with statistics data and error if any
 */
export async function getOrderStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
  timeframe: "week" | "month" | "year" = "month",
): Promise<{ data: any; error: any }> {
  try {
    // For demo user IDs, return demo data
    if (userId.startsWith("user-")) {
      console.log("Using demo order statistics for demo user")
      return {
        data: {
          totalOrders: 24,
          placedOrders: 5,
          confirmedOrders: 8,
          dispatchedOrders: 4,
          deliveredOrders: 6,
          rejectedOrders: 1,
          totalAmount: role === "retailer" ? 45000 : 42000,
          averageOrderValue: role === "retailer" ? 1875 : 1750,
          ordersByDay: [
            { date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0], count: 3, amount: 5500 },
            { date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], count: 4, amount: 7200 },
            { date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], count: 2, amount: 3800 },
            { date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], count: 5, amount: 9500 },
            { date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], count: 3, amount: 5700 },
            { date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], count: 4, amount: 7800 },
            { date: new Date().toISOString().split("T")[0], count: 3, amount: 5500 },
          ],
          topProducts: [
            { name: "Premium Wheat Flour", quantity: 120, amount: 12000 },
            { name: "Refined Sugar", quantity: 80, amount: 8000 },
            { name: "Cooking Oil", quantity: 60, amount: 7200 },
            { name: "Basmati Rice", quantity: 50, amount: 6000 },
            { name: "Toor Dal", quantity: 40, amount: 4800 },
          ],
          period: timeframe === "week" ? "Last 7 days" : timeframe === "year" ? "Last 12 months" : "Last 30 days",
        },
        error: null,
      }
    }

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Query orders for the user in the date range
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .gte("created_at", startDateStr)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching order statistics:", error)
      return { data: null, error }
    }

    // Calculate statistics
    const totalOrders = orders?.length || 0
    const placedOrders = orders?.filter((o) => o.status === "placed").length || 0
    const confirmedOrders = orders?.filter((o) => o.status === "confirmed").length || 0
    const dispatchedOrders = orders?.filter((o) => o.status === "dispatched").length || 0
    const deliveredOrders = orders?.filter((o) => o.status === "delivered").length || 0
    const rejectedOrders = orders?.filter((o) => o.status === "rejected").length || 0

    const totalAmount = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const averageOrderValue = totalOrders ? totalAmount / totalOrders : 0

    // Group by day for trend analysis
    const ordersByDay: Record<string, { count: number; amount: number }> = {}
    orders?.forEach((o) => {
      const day = o.created_at.split("T")[0]
      if (!ordersByDay[day]) {
        ordersByDay[day] = { count: 0, amount: 0 }
      }
      ordersByDay[day].count += 1
      ordersByDay[day].amount += o.total_amount || 0
    })

    // Get top products
    const productQuantities: Record<string, { quantity: number; amount: number }> = {}
    orders?.forEach((order) => {
      order.order_items?.forEach((item: any) => {
        if (!productQuantities[item.product_id]) {
          productQuantities[item.product_id] = { quantity: 0, amount: 0 }
        }
        productQuantities[item.product_id].quantity += item.quantity || 0
        productQuantities[item.product_id].amount += item.total_price || 0
      })
    })

    // Get product details for top products
    const topProducts = []
    const productIds = Object.keys(productQuantities)

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds)

      if (!productsError && products) {
        const productMap = products.reduce(
          (map, p) => {
            map[p.id] = p.name
            return map
          },
          {} as Record<string, string>,
        )

        topProducts.push(
          ...Object.entries(productQuantities)
            .map(([id, data]) => ({
              name: productMap[id] || `Product ${id}`,
              quantity: data.quantity,
              amount: data.amount,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5),
        )
      }
    }

    const statistics = {
      totalOrders,
      placedOrders,
      confirmedOrders,
      dispatchedOrders,
      deliveredOrders,
      rejectedOrders,
      totalAmount,
      averageOrderValue,
      ordersByDay: Object.entries(ordersByDay).map(([date, data]) => ({
        date,
        count: data.count,
        amount: data.amount,
      })),
      topProducts,
      period: timeframe === "week" ? "Last 7 days" : timeframe === "year" ? "Last 12 months" : "Last 30 days",
    }

    return { data: statistics, error: null }
  } catch (error) {
    console.error("Error calculating order statistics:", error)
    return { data: null, error }
  }
}

/**
 * Cancel an order
 * @param orderId Order ID to cancel
 * @param reason Optional reason for cancellation
 * @returns Promise with success status and error if any
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error: any }> {
  try {
    // Handle demo order IDs
    if (orderId.startsWith("demo-")) {
      console.log("Using demo order cancellation for demo order")
      return { success: true, error: null }
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      console.error("Error cancelling order:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error cancelling order:", error)
    return { success: false, error }
  }
}

/**
 * Get order history for a user
 * @param userId User ID to get history for
 * @param role User role (retailer or wholesaler)
 * @param limit Optional limit for pagination
 * @param offset Optional offset for pagination
 * @returns Promise with order history data, count, and error if any
 */
export async function getOrderHistory(
  userId: string,
  role: "retailer" | "wholesaler",
  limit = 10,
  offset = 0,
): Promise<{ data: Order[]; count: number; error: any }> {
  try {
    // For demo user IDs, return demo data
    if (userId.startsWith("user-")) {
      console.log("Using demo order history for demo user")
      const demoOrders = [
        {
          id: "demo-history-1",
          order_number: "ORD12345678",
          retailer_id: role === "retailer" ? userId : "user-retailer-1",
          wholesaler_id: role === "wholesaler" ? userId : "user-wholesaler-1",
          status: "delivered",
          payment_status: "completed",
          total_amount: 2500,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          delivery_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          retailer: {
            business_name: "Demo Retail Store",
            name: "Vikram Singh",
          },
          wholesaler: {
            business_name: "Premium Wholesale Supplies",
            name: "Rajesh Sharma",
          },
        },
        {
          id: "demo-history-2",
          order_number: "ORD87654321",
          retailer_id: role === "retailer" ? userId : "user-retailer-2",
          wholesaler_id: role === "wholesaler" ? userId : "user-wholesaler-2",
          status: "delivered",
          payment_status: "completed",
          total_amount: 3500,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          delivery_date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          retailer: {
            business_name: "Another Retail Shop",
            name: "Suresh Kumar",
          },
          wholesaler: {
            business_name: "Mega Distributors Ltd",
            name: "Amit Patel",
          },
        },
      ]

      return { data: demoOrders, count: demoOrders.length, error: null }
    }

    // For real users, query the database
    const { data, count, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        retailer:retailer_id(business_name, name),
        wholesaler:wholesaler_id(business_name, name)
      `,
        { count: "exact" },
      )
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .in("status", ["delivered", "cancelled"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching order history:", error)
      return { data: [], count: 0, error }
    }

    return { data: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching order history:", error)
    return { data: [], count: 0, error }
  }
}

/**
 * Get recent orders for a user
 * @param userId User ID to get recent orders for
 * @param role User role (retailer or wholesaler)
 * @param limit Optional limit for number of orders
 * @returns Promise with recent orders data and error if any
 */
export async function getRecentOrders(
  userId: string,
  role: "retailer" | "wholesaler",
  limit = 5,
): Promise<{ data: Order[]; error: any }> {
  try {
    // For demo user IDs, return demo data
    if (userId.startsWith("user-")) {
      console.log("Using demo recent orders for demo user")
      const demoOrders = [
        {
          id: "demo-order-1",
          order_number: "ORD12345678",
          retailer_id: role === "retailer" ? userId : "user-retailer-1",
          wholesaler_id: role === "wholesaler" ? userId : "user-wholesaler-1",
          status: "placed",
          payment_status: "pending",
          total_amount: 2500,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          retailer: {
            business_name: "Demo Retail Store",
          },
          wholesaler: {
            business_name: "Premium Wholesale Supplies",
          },
        },
        {
          id: "demo-order-2",
          order_number: "ORD87654321",
          retailer_id: role === "retailer" ? userId : "user-retailer-2",
          wholesaler_id: role === "wholesaler" ? userId : "user-wholesaler-2",
          status: "confirmed",
          payment_status: "pending",
          total_amount: 3500,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          retailer: {
            business_name: "Another Retail Shop",
          },
          wholesaler: {
            business_name: "Mega Distributors Ltd",
          },
        },
      ]

      return { data: demoOrders, error: null }
    }

    // For real users, query the database
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        retailer:retailer_id(business_name),
        wholesaler:wholesaler_id(business_name)
      `)
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent orders:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return { data: [], error }
  }
}

// Add a helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Export the order service as a named export
export const orderService = {
  getAllOrders,
  getOrdersByRetailer,
  getOrdersByWholesaler,
  getOrderById,
  getOrdersByRetailerId,
  getOrdersByWholesalerId,
  createOrder,
  addOrderItems,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStatistics,
  cancelOrder,
  getOrderHistory,
  getRecentOrders,
}
