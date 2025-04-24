import { supabase } from "@/lib/supabase-client"

// Mark COD payment as collected
export async function markCodPaymentCollected(
  paymentId: string,
  collectedById: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        collected_by: collectedById,
      })
      .eq("id", paymentId)
      .eq("payment_method", "cod")

    if (!error) {
      // Get order ID
      const { data: payment } = await supabase.from("payments").select("order_id").eq("id", paymentId).single()

      if (payment) {
        // Update order payment status
        await supabase.from("orders").update({ payment_status: "completed" }).eq("id", payment.order_id)
      }
    }

    return { success: !error, error }
  } catch (error) {
    console.error("Error marking COD payment as collected:", error)
    return { success: false, error }
  }
}

// Verify UPI payment
export async function verifyUpiPayment(data: {
  payment_id: string
  transaction_id: string
}): Promise<{ success: boolean; error: any }> {
  try {
    // In a real app, this would verify the transaction with a payment gateway
    // For now, we'll just update the payment status

    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: "completed",
        payment_date: new Date().toISOString(),
        transaction_id: data.transaction_id,
      })
      .eq("id", data.payment_id)
      .eq("payment_method", "upi")

    if (!error) {
      // Get order ID
      const { data: payment } = await supabase.from("payments").select("order_id").eq("id", data.payment_id).single()

      if (payment) {
        // Update order payment status
        await supabase.from("orders").update({ payment_status: "completed" }).eq("id", payment.order_id)
      }
    }

    return { success: !error, error }
  } catch (error) {
    console.error("Error verifying UPI payment:", error)
    return { success: false, error }
  }
}

// Get payments by user ID
export async function getPaymentsByUserId(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{ data: any[] | null; error: any }> {
  try {
    // Determine the role-specific field to filter by
    const roleField = role === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get payments for the user
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        order:orders!inner(
          id,
          order_number,
          ${roleField},
          total_amount,
          status,
          payment_method,
          payment_status,
          created_at
        )
      `,
      )
      .eq(`order.${roleField}`, userId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting payments by user ID:", error)
    return { data: null, error }
  }
}

// Get payment statistics
export async function getPaymentStatistics(
  userId: string,
  role: "retailer" | "wholesaler",
): Promise<{ data: any | null; error: any }> {
  try {
    // Determine the role-specific field to filter by
    const roleField = role === "retailer" ? "retailer_id" : "wholesaler_id"

    // Get payments for the user
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        order:orders!inner(
          id,
          ${roleField},
          total_amount,
          payment_status
        )
      `,
      )
      .eq(`order.${roleField}`, userId)

    if (error) {
      return { data: null, error }
    }

    // Calculate statistics
    const totalPayments = payments.length
    const completedPayments = payments.filter((payment) => payment.payment_status === "completed")
    const pendingPayments = payments.filter((payment) => payment.payment_status === "pending")

    const completedAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)

    return {
      data: {
        total_payments: totalPayments,
        completed_payments: completedPayments.length,
        pending_payments: pendingPayments.length,
        completed_amount: completedAmount,
        pending_amount: pendingAmount,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting payment statistics:", error)
    return { data: null, error }
  }
}

// Create a new payment
export async function createPayment(paymentData: {
  order_id: string
  amount: number
  payment_method: "cod" | "upi"
  upi_id?: string
}): Promise<{ data: any | null; error: any }> {
  try {
    // Generate reference ID
    const referenceId = `PAY${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_status: "pending",
        reference_id: referenceId,
        upi_id: paymentData.upi_id,
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { data: null, error }
  }
}
