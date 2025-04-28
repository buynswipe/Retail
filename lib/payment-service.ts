import { supabase } from "./supabase-client"
import { createNotification } from "./notification-service"

// Process payment
export async function processPayment(paymentData: {
  order_id: string
  amount: number
  payment_method: string
  upi_id?: string
  card_details?: any
}): Promise<{ success: boolean; transaction_id?: string; error: any }> {
  try {
    // In a real app, this would integrate with a payment gateway
    // For now, we'll simulate a successful payment

    // Create a payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_details:
          paymentData.payment_method === "upi" ? { upi_id: paymentData.upi_id } : paymentData.card_details,
        status: "completed",
        transaction_id: `TXN${Date.now()}`,
      })
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Update order payment status
    const { success, error: updateError } = await updatePaymentStatus(paymentData.order_id, "completed")

    if (updateError) {
      throw updateError
    }

    // Get order details for notification
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("retailer_id, wholesaler_id")
      .eq("id", paymentData.order_id)
      .single()

    if (orderError) {
      throw orderError
    }

    // Create payment notification
    await createNotification({
      user_id: order.retailer_id,
      title: "Payment Successful",
      message: `Your payment of ${paymentData.amount.toFixed(2)} for order #${paymentData.order_id.slice(0, 8)} was successful.`,
      type: "payment",
      reference_id: paymentData.order_id,
    })

    await createNotification({
      user_id: order.wholesaler_id,
      title: "Payment Received",
      message: `Payment of ${paymentData.amount.toFixed(2)} for order #${paymentData.order_id.slice(0, 8)} has been received.`,
      type: "payment",
      reference_id: paymentData.order_id,
    })

    return { success: true, transaction_id: payment.transaction_id, error: null }
  } catch (error) {
    console.error("Error processing payment:", error)
    return { success: false, error }
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting payment:", error)
    return { data: null, error }
  }
}

// Get payments by user ID (retailer or wholesaler)
export async function getPaymentsByUser(userId: string, role: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)

    if (ordersError) {
      throw ordersError
    }

    if (!orders.length) {
      return { data: [], error: null }
    }

    const orderIds = orders.map((order) => order.id)

    const { data, error } = await supabase
      .from("payments")
      .select("*, order:orders(*)")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting payments:", error)
    return { data: null, error }
  }
}

// Get payment statistics
export async function getPaymentStatistics(userId: string, role: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data: payments, error: paymentsError } = await getPaymentsByUser(userId, role)

    if (paymentsError) {
      throw paymentsError
    }

    // Calculate statistics
    const totalPayments = payments.length
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

    // Group by payment method
    const paymentMethods = {}
    payments.forEach((payment) => {
      if (!paymentMethods[payment.payment_method]) {
        paymentMethods[payment.payment_method] = 0
      }
      paymentMethods[payment.payment_method]++
    })

    // Group by month
    const paymentsByMonth = {}
    payments.forEach((payment) => {
      const date = new Date(payment.created_at)
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`

      if (!paymentsByMonth[month]) {
        paymentsByMonth[month] = 0
      }
      paymentsByMonth[month] += payment.amount
    })

    return {
      data: {
        totalPayments,
        totalAmount,
        paymentMethods,
        paymentsByMonth,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting payment statistics:", error)
    return { data: null, error }
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; error: any }> {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError) {
      throw paymentError
    }

    // In a real app, this would integrate with a payment gateway for refund
    // For now, we'll simulate a successful refund

    // Create refund record
    const refundAmount = amount || payment.amount
    const { error: refundError } = await supabase.from("refunds").insert({
      payment_id: paymentId,
      amount: refundAmount,
      status: "completed",
      refund_id: `REF${Date.now()}`,
    })

    if (refundError) {
      throw refundError
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: amount ? "partially_refunded" : "refunded",
        refunded_amount: refundAmount,
      })
      .eq("id", paymentId)

    if (updateError) {
      throw updateError
    }

    // Get order details for notification
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("retailer_id, wholesaler_id")
      .eq("id", payment.order_id)
      .single()

    if (orderError) {
      throw orderError
    }

    // Create refund notification
    await createNotification({
      user_id: order.retailer_id,
      title: "Refund Processed",
      message: `A refund of ${refundAmount.toFixed(2)} for order #${payment.order_id.slice(0, 8)} has been processed.`,
      type: "payment",
      reference_id: payment.order_id,
    })

    await createNotification({
      user_id: order.wholesaler_id,
      title: "Refund Issued",
      message: `A refund of ${refundAmount.toFixed(2)} for order #${payment.order_id.slice(0, 8)} has been issued.`,
      type: "payment",
      reference_id: payment.order_id,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error processing refund:", error)
    return { success: false, error }
  }
}

// Mark COD payment as collected
export async function markCodPaymentCollected(
  orderId: string,
  collectedBy: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("payment_method, total_amount, retailer_id, wholesaler_id")
      .eq("id", orderId)
      .single()

    if (orderError) {
      throw orderError
    }

    if (order.payment_method !== "cod") {
      throw new Error("Order is not a COD payment")
    }

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      amount: order.total_amount,
      payment_method: "cod",
      status: "completed",
      payment_details: { collected_by: collectedBy, collected_at: new Date().toISOString() },
      transaction_id: `COD${Date.now()}`,
    })

    if (paymentError) {
      throw paymentError
    }

    // Update order payment status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      throw updateError
    }

    // Create notifications
    await createNotification({
      user_id: order.retailer_id,
      title: "COD Payment Collected",
      message: `Cash payment for order #${orderId.slice(0, 8)} has been collected.`,
      type: "payment",
      reference_id: orderId,
    })

    await createNotification({
      user_id: order.wholesaler_id,
      title: "COD Payment Collected",
      message: `Cash payment for order #${orderId.slice(0, 8)} has been collected.`,
      type: "payment",
      reference_id: orderId,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking COD payment as collected:", error)
    return { success: false, error }
  }
}

// Get payments by user ID (alias for getPaymentsByUser for compatibility)
export async function getPaymentsByUserId(userId: string, role: string): Promise<{ data: any[] | null; error: any }> {
  return await getPaymentsByUser(userId, role)
}

// Update payment status for an order
export async function updatePaymentStatus(orderId: string, status: string): Promise<{ success: boolean; error: any }> {
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

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}
