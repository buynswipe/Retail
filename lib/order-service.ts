import { supabase } from "./supabase-client"
import type { Order } from "./types"
import { updateProductStock } from "./inventory-service"
import { createNotification } from "./notification-service"

// Create a new order
export async function createOrder(orderData: {
  retailer_id: string
  wholesaler_id: string
  total_amount: number
  payment_status: string
  delivery_address: string
  delivery_contact: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
  }[]
}): Promise<{ data: Order | null; error: any }> {
  try {
    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        retailer_id: orderData.retailer_id,
        wholesaler_id: orderData.wholesaler_id,
        status: "pending",
        total_amount: orderData.total_amount,
        payment_status: orderData.payment_status,
        delivery_address: orderData.delivery_address,
        delivery_contact: orderData.delivery_contact,
        notes: orderData.notes,
        expected_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Insert order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      throw itemsError
    }

    // Create notifications for both retailer and wholesaler
    await createNotification({
      user_id: orderData.retailer_id,
      title: "Order Placed",
      message: `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
      type: "order",
      reference_id: order.id,
    })

    await createNotification({
      user_id: orderData.wholesaler_id,
      title: "New Order Received",
      message: `You have received a new order #${order.id.slice(0, 8)}.`,
      type: "order",
      reference_id: order.id,
    })

    return { data: order, error: null }
  } catch (error) {
    console.error("Error creating order:", error)
    return { data: null, error }
  }
}

// Get orders for a retailer
export async function getRetailerOrders(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
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
          subtotal,
          product:products(*)
        ),
        wholesaler:users!wholesaler_id(
          id,
          name,
          business_name,
          profile_image,
          city,
          state
        )
      `,
      )
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting retailer orders:", error)
    return { data: null, error }
  }
}

// Get orders for a wholesaler
export async function getWholesalerOrders(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
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
          subtotal,
          product:products(*)
        ),
        retailer:users!retailer_id(
          id,
          name,
          business_name,
          profile_image,
          city,
          state
        )
      `,
      )
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting wholesaler orders:", error)
    return { data: null, error }
  }
}

// Get order by ID
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
          subtotal,
          product:products(*)
        ),
        retailer:users!retailer_id(
          id,
          name,
          business_name,
          profile_image,
          address,
          city,
          state,
          pincode,
          phone,
          email
        ),
        wholesaler:users!wholesaler_id(
          id,
          name,
          business_name,
          profile_image,
          address,
          city,
          state,
          pincode,
          phone,
          email
        )
      `,
      )
      .eq("id", orderId)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error getting order:", error)
    return { data: null, error }
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: string,
  userId: string,
  userRole: string,
  reason?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get the current order
    const { data: order, error: orderError } = await getOrderById(orderId)

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    // Check permissions
    if (
      (userRole === "retailer" && order.retailer_id !== userId) ||
      (userRole === "wholesaler" && order.wholesaler_id !== userId)
    ) {
      throw new Error("You don't have permission to update this order")
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["returned"],
      cancelled: [],
      returned: [],
    }

    if (!validTransitions[order.status].includes(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`)
    }

    // Update the order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
        status_history: [
          ...(order.status_history || []),
          {
            status: status,
            timestamp: new Date().toISOString(),
            updated_by: userId,
            role: userRole,
            reason: reason || null,
          },
        ],
      })
      .eq("id", orderId)

    if (updateError) {
      throw updateError
    }

    // Handle inventory updates for specific status changes
    if (status === "confirmed" && order.status === "pending") {
      // Reserve inventory when order is confirmed
      for (const item of order.items) {
        await updateProductStock(item.product_id, -item.quantity, "reserved", `Reserved for order #${orderId}`)
      }
    } else if (status === "cancelled") {
      // Return inventory if order is cancelled after confirmation
      if (["confirmed", "processing"].includes(order.status)) {
        for (const item of order.items) {
          await updateProductStock(
            item.product_id,
            item.quantity,
            "returned",
            `Returned from cancelled order #${orderId}`,
          )
        }
      }
    } else if (status === "shipped" && order.status === "processing") {
      // Deduct inventory when order is shipped
      for (const item of order.items) {
        await updateProductStock(item.product_id, -item.quantity, "sold", `Sold in order #${orderId}`)
      }

      // Update expected delivery date
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 1) // 1 day from now for shipping

      await supabase
        .from("orders")
        .update({
          expected_delivery_date: deliveryDate.toISOString(),
        })
        .eq("id", orderId)
    } else if (status === "returned" && order.status === "delivered") {
      // Return inventory when order is returned after delivery
      for (const item of order.items) {
        await updateProductStock(item.product_id, item.quantity, "returned", `Returned from order #${orderId}`)
      }
    }

    // Create notifications
    let notificationTitle = ""
    let notificationMessage = ""
    let recipientId = ""

    switch (status) {
      case "confirmed":
        notificationTitle = "Order Confirmed"
        notificationMessage = `Your order #${orderId.slice(0, 8)} has been confirmed.`
        recipientId = order.retailer_id
        break
      case "processing":
        notificationTitle = "Order Processing"
        notificationMessage = `Your order #${orderId.slice(0, 8)} is now being processed.`
        recipientId = order.retailer_id
        break
      case "shipped":
        notificationTitle = "Order Shipped"
        notificationMessage = `Your order #${orderId.slice(0, 8)} has been shipped.`
        recipientId = order.retailer_id
        break
      case "delivered":
        notificationTitle = "Order Delivered"
        notificationMessage = `Your order #${orderId.slice(0, 8)} has been delivered.`
        recipientId = order.retailer_id
        break
      case "cancelled":
        if (userRole === "retailer") {
          notificationTitle = "Order Cancelled"
          notificationMessage = `Order #${orderId.slice(0, 8)} has been cancelled by the retailer.`
          recipientId = order.wholesaler_id
        } else {
          notificationTitle = "Order Cancelled"
          notificationMessage = `Your order #${orderId.slice(0, 8)} has been cancelled by the wholesaler.`
          recipientId = order.retailer_id
        }
        break
      case "returned":
        notificationTitle = "Order Returned"
        notificationMessage = `Order #${orderId.slice(0, 8)} has been marked as returned.`
        recipientId = userRole === "retailer" ? order.wholesaler_id : order.retailer_id
        break
    }

    if (notificationTitle && recipientId) {
      await createNotification({
        user_id: recipientId,
        title: notificationTitle,
        message: notificationMessage,
        type: "order",
        reference_id: orderId,
      })
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
  paymentStatus: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      throw error
    }

    // Get order details for notification
    const { data: order } = await getOrderById(orderId)

    if (order) {
      // Create notification for payment status change
      await createNotification({
        user_id: order.retailer_id,
        title: "Payment Status Updated",
        message: `Payment for order #${orderId.slice(0, 8)} is now ${paymentStatus}.`,
        type: "payment",
        reference_id: orderId,
      })

      await createNotification({
        user_id: order.wholesaler_id,
        title: "Payment Status Updated",
        message: `Payment for order #${orderId.slice(0, 8)} is now ${paymentStatus}.`,
        type: "payment",
        reference_id: orderId,
      })
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Get order statistics for a user
export async function getOrderStatistics(userId: string, role: string): Promise<{ data: any | null; error: any }> {
  try {
    const roleField = role === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get total orders
    const { count: totalOrders, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq(roleField, userId)

    if (countError) {
      throw countError
    }

    // Get orders by status
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]
    const ordersByStatus: Record<string, number> = {}

    for (const status of statuses) {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq(roleField, userId)
        .eq("status", status)

      if (error) {
        throw error
      }

      ordersByStatus[status] = count || 0
    }

    // Get total spent/earned
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq(roleField, userId)
      .eq("status", "delivered")

    if (ordersError) {
      throw ordersError
    }

    const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0)

    // Get recent orders
    const { data: recentOrders, error: recentError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        retailer:users!retailer_id(name, business_name),
        wholesaler:users!wholesaler_id(name, business_name)
      `,
      )
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
      error: null,
    }
  } catch (error) {
    console.error("Error getting order statistics:", error)
    return { data: null, error }
  }
}

// Get order timeline events
export async function getOrderTimeline(orderId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status_history, created_at")
      .eq("id", orderId)
      .single()

    if (orderError) {
      throw orderError
    }

    // Start with order creation as first event
    const timeline = [
      {
        status: "created",
        timestamp: order.created_at,
        title: "Order Created",
        description: "Your order has been placed successfully",
      },
    ]

    // Add status history events
    if (order.status_history && Array.isArray(order.status_history)) {
      order.status_history.forEach((event: any) => {
        let title = ""
        let description = ""

        switch (event.status) {
          case "pending":
            title = "Order Pending"
            description = "Waiting for confirmation from wholesaler"
            break
          case "confirmed":
            title = "Order Confirmed"
            description = "Your order has been confirmed"
            break
          case "processing":
            title = "Order Processing"
            description = "Your order is being prepared"
            break
          case "shipped":
            title = "Order Shipped"
            description = "Your order is on the way"
            break
          case "delivered":
            title = "Order Delivered"
            description = "Your order has been delivered"
            break
          case "cancelled":
            title = "Order Cancelled"
            description = event.reason || "Order has been cancelled"
            break
          case "returned":
            title = "Order Returned"
            description = event.reason || "Order has been returned"
            break
        }

        timeline.push({
          status: event.status,
          timestamp: event.timestamp,
          title,
          description,
          updatedBy: event.role,
          reason: event.reason,
        })
      })
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return { data: timeline, error: null }
  } catch (error) {
    console.error("Error getting order timeline:", error)
    return { data: null, error }
  }
}

// Generate invoice for an order
export async function generateOrderInvoice(orderId: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data: order, error: orderError } = await getOrderById(orderId)

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    // In a real application, you would generate a PDF invoice here
    // For now, we'll just return the order data
    const invoiceData = {
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
      orderNumber: order.id,
      date: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      customer: {
        name: order.retailer.business_name || order.retailer.name,
        address: order.retailer.address,
        city: order.retailer.city,
        state: order.retailer.state,
        pincode: order.retailer.pincode,
        phone: order.retailer.phone,
      },
      seller: {
        name: order.wholesaler.business_name || order.wholesaler.name,
        address: order.wholesaler.address,
        city: order.wholesaler.city,
        state: order.wholesaler.state,
        pincode: order.wholesaler.pincode,
        phone: order.wholesaler.phone,
      },
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.subtotal,
      })),
      subtotal: order.total_amount,
      tax: order.total_amount * 0.18, // Assuming 18% GST
      total: order.total_amount * 1.18,
      notes: "Thank you for your business!",
    }

    return { data: invoiceData, error: null }
  } catch (error) {
    console.error("Error generating invoice:", error)
    return { data: null, error }
  }
}

// Cancel an order
export async function cancelOrder(
  orderId: string,
  userId: string,
  userRole: string,
  reason: string,
): Promise<{ success: boolean; error: any }> {
  try {
    return await updateOrderStatus(orderId, "cancelled", userId, userRole, reason)
  } catch (error) {
    console.error("Error cancelling order:", error)
    return { success: false, error }
  }
}

// Get orders by retailer (alias for getRetailerOrders for compatibility)
export async function getOrdersByRetailer(retailerId: string): Promise<{ data: Order[] | null; error: any }> {
  return await getRetailerOrders(retailerId)
}

// Get orders by wholesaler (alias for getWholesalerOrders for compatibility)
export async function getOrdersByWholesaler(wholesalerId: string): Promise<{ data: Order[] | null; error: any }> {
  return await getWholesalerOrders(wholesalerId)
}
