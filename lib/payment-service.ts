import { supabase } from "./supabase-client"
import type { Order } from "./order-service"

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: "cod" | "upi"
  payment_status: "pending" | "completed" | "failed"
  transaction_id?: string
  upi_id?: string
  payment_date?: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentData {
  order_id: string
  amount: number
  payment_method: "cod" | "upi"
  upi_id?: string
}

export interface VerifyPaymentData {
  payment_id: string
  transaction_id: string
}

// Generate a unique payment reference ID
function generatePaymentRefId(): string {
  const timestamp = new Date().getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `PAY${timestamp}${random}`
}

// Create a new payment record
export async function createPayment(data: CreatePaymentData): Promise<{ data: Payment | null; error: any }> {
  try {
    // For COD payments, we'll mark them as pending by default
    const paymentStatus = data.payment_method === "cod" ? "pending" : "pending"

    // Create payment in database
    const { data: paymentResult, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: data.order_id,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_status: paymentStatus,
        upi_id: data.upi_id,
        reference_id: generatePaymentRefId(),
      })
      .select()
      .single()

    if (paymentError) {
      return { data: null, error: paymentError }
    }

    return { data: paymentResult, error: null }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { data: null, error }
  }
}

// Get payment by order ID
export async function getPaymentByOrderId(orderId: string): Promise<{ data: Payment | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("order_id", orderId).single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching payment:", error)
    return { data: null, error }
  }
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<{ data: Payment | null; error: any }> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching payment:", error)
    return { data: null, error }
  }
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "completed" | "failed",
): Promise<{ success: boolean; error: any }> {
  try {
    const updateData: any = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    }

    // If payment is completed, add payment date
    if (status === "completed") {
      updateData.payment_date = new Date().toISOString()
    }

    const { error } = await supabase.from("payments").update(updateData).eq("id", paymentId)

    if (error) {
      return { success: false, error }
    }

    // If payment is completed, update order payment status
    if (status === "completed") {
      // Get order ID from payment
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("order_id")
        .eq("id", paymentId)
        .single()

      if (paymentError) {
        return { success: true, error: null } // Still return success for payment update
      }

      // Update order payment status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id)

      if (orderError) {
        console.error("Error updating order payment status:", orderError)
        return { success: true, error: null } // Still return success for payment update
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error }
  }
}

// Verify UPI payment
export async function verifyUpiPayment(data: VerifyPaymentData): Promise<{ success: boolean; error: any }> {
  try {
    // In a real app, you would verify the transaction with a payment gateway
    // For now, we'll just update the payment record with the transaction ID

    const { error } = await supabase
      .from("payments")
      .update({
        transaction_id: data.transaction_id,
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.payment_id)

    if (error) {
      return { success: false, error }
    }

    // Get order ID from payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("order_id")
      .eq("id", data.payment_id)
      .single()

    if (paymentError) {
      return { success: true, error: null } // Still return success for payment update
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)

    if (orderError) {
      console.error("Error updating order payment status:", orderError)
      return { success: true, error: null } // Still return success for payment update
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return { success: false, error }
  }
}

// Get payments by user ID (retailer or wholesaler)
export async function getPaymentsByUserId(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{ data: (Payment & { order?: Order })[] | null; error: any }> {
  try {
    // First get orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, created_at")
      .eq(`${role}_id`, userId)
      .order("created_at", { ascending: false })

    if (ordersError) {
      return { data: null, error: ordersError }
    }

    if (orders.length === 0) {
      return { data: [], error: null }
    }

    // Get payments for these orders
    const orderIds = orders.map((order) => order.id)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })

    if (paymentsError) {
      return { data: null, error: paymentsError }
    }

    // Combine payments with order info
    const paymentsWithOrders = payments.map((payment) => {
      const order = orders.find((o) => o.id === payment.order_id)
      return {
        ...payment,
        order,
      }
    })

    return { data: paymentsWithOrders, error: null }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { data: null, error }
  }
}

// Mark COD payment as collected (for delivery partners)
export async function markCodPaymentCollected(
  paymentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // In a real app, you would verify that this delivery partner is assigned to the order
    // For now, we'll just update the payment status

    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        collected_by: deliveryPartnerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("payment_method", "cod") // Only update if it's a COD payment

    if (error) {
      return { success: false, error }
    }

    // Get order ID from payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("order_id")
      .eq("id", paymentId)
      .single()

    if (paymentError) {
      return { success: true, error: null } // Still return success for payment update
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)

    if (orderError) {
      console.error("Error updating order payment status:", orderError)
      return { success: true, error: null } // Still return success for payment update
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking COD payment as collected:", error)
    return { success: false, error }
  }
}

// Get payment statistics for a user
export async function getPaymentStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{
  data: {
    total_payments: number
    total_amount: number
    pending_amount: number
    completed_amount: number
  } | null
  error: any
}> {
  try {
    // First get orders for the user
    const { data: orders, error: ordersError } = await supabase.from("orders").select("id").eq(`${role}_id`, userId)

    if (ordersError) {
      return { data: null, error: ordersError }
    }

    if (orders.length === 0) {
      return {
        data: {
          total_payments: 0,
          total_amount: 0,
          pending_amount: 0,
          completed_amount: 0,
        },
        error: null,
      }
    }

    // Get payments for these orders
    const orderIds = orders.map((order) => order.id)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .in("order_id", orderIds)

    if (paymentsError) {
      return { data: null, error: paymentsError }
    }

    // Calculate statistics
    const totalPayments = payments.length
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const pendingAmount = payments
      .filter((payment) => payment.payment_status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0)
    const completedAmount = payments
      .filter((payment) => payment.payment_status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0)

    return {
      data: {
        total_payments: totalPayments,
        total_amount: totalAmount,
        pending_amount: pendingAmount,
        completed_amount: completedAmount,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching payment statistics:", error)
    return { data: null, error }
  }
}
