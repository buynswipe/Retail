import { supabase, supabaseAdmin, type DeliveryAssignment } from "./supabase-client"

// Get all delivery assignments
export async function getAllAssignments() {
  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders(*)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching assignments:", error)
    throw new Error("Failed to fetch assignments")
  }

  return data
}

/**
 * Get assignments by delivery partner
 */
export async function getAssignmentsByDeliveryPartner(deliveryPartnerId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("DeliveryAssignments")
      .select("*, Orders(*)", { count: "exact" })
      .eq("delivery_partner_id", deliveryPartnerId)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching delivery assignments:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Get available assignments by pin code
 */
export async function getAvailableAssignmentsByPinCode(pinCode: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("DeliveryAssignments")
      .select("*, Orders(*)", { count: "exact" })
      .eq("status", "pending")
      .eq("delivery_pin_code", pinCode)
      .is("delivery_partner_id", null)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching available assignments:", error)
    return { data: null, error, count: 0 }
  }
}

// Get a specific assignment
export async function getAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders(*)")
    .eq("id", assignmentId)
    .single()

  if (error) {
    console.error("Error fetching assignment:", error)
    throw new Error("Failed to fetch assignment")
  }

  return data
}

/**
 * Get delivery assignment by order ID
 */
export async function getDeliveryAssignmentByOrderId(orderId: string) {
  try {
    const { data, error } = await supabase.from("DeliveryAssignments").select("*").eq("order_id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching delivery assignment:", error)
    return { data: null, error }
  }
}

/**
 * Accept a delivery assignment
 */
export async function acceptDeliveryAssignment(assignmentId: string, deliveryPartnerId: string) {
  try {
    const { data, error } = await supabase
      .from("DeliveryAssignments")
      .update({
        delivery_partner_id: deliveryPartnerId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("status", "pending")
      .is("delivery_partner_id", null)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error accepting assignment:", error)
    return { data: null, error }
  }
}

/**
 * Alias for acceptDeliveryAssignment
 */
export async function acceptAssignment(assignmentId: string, deliveryPartnerId: string) {
  return acceptDeliveryAssignment(assignmentId, deliveryPartnerId)
}

// Complete an assignment
export async function completeAssignment(assignmentId: string, proofImageUrl: string) {
  const { data: assignment } = await supabase
    .from("delivery_assignments")
    .select("order_id")
    .eq("id", assignmentId)
    .single()

  if (!assignment) {
    throw new Error("Assignment not found")
  }

  // Start a transaction
  const { error: updateAssignmentError } = await supabase
    .from("delivery_assignments")
    .update({ status: "completed", proof_image_url: proofImageUrl })
    .eq("id", assignmentId)
    .eq("status", "accepted")

  if (updateAssignmentError) {
    console.error("Error completing assignment:", updateAssignmentError)
    throw new Error("Failed to complete assignment")
  }

  // Update the order status
  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", assignment.order_id)

  if (updateOrderError) {
    console.error("Error updating order status:", updateOrderError)
    throw new Error("Failed to update order status")
  }

  return { success: true }
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(assignmentId: string, status: string) {
  try {
    const updates: Partial<DeliveryAssignment> = { status }

    // Add timestamp based on status
    if (status === "picked_up") {
      updates.picked_up_at = new Date().toISOString()
    } else if (status === "delivered") {
      updates.delivered_at = new Date().toISOString()
    } else if (status === "failed") {
      updates.failed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("DeliveryAssignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error updating delivery status:", error)
    return { data: null, error }
  }
}

// Create a new delivery assignment
export async function createAssignment(assignment: Omit<DeliveryAssignment, "id" | "created_at" | "updated_at">) {
  const { error } = await supabaseAdmin.from("delivery_assignments").insert(assignment)

  if (error) {
    console.error("Error creating assignment:", error)
    throw new Error("Failed to create assignment")
  }

  return { success: true }
}

/**
 * Create a delivery assignment
 */
export async function createDeliveryAssignment(assignment: Omit<DeliveryAssignment, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from("DeliveryAssignments")
      .insert({
        ...assignment,
        status: assignment.status || "pending",
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating delivery assignment:", error)
    return { data: null, error }
  }
}

// Generate OTP for delivery verification
export async function generateDeliveryOTP(assignmentId: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP

  const { error } = await supabase.from("delivery_assignments").update({ otp }).eq("id", assignmentId)

  if (error) {
    console.error("Error generating OTP:", error)
    throw new Error("Failed to generate OTP")
  }

  return { success: true, otp }
}

// Verify OTP for delivery
export async function verifyDeliveryOTP(assignmentId: string, otp: string) {
  const { data, error } = await supabase.from("delivery_assignments").select("otp").eq("id", assignmentId).single()

  if (error) {
    console.error("Error verifying OTP:", error)
    throw new Error("Failed to verify OTP")
  }

  return { success: data.otp === otp }
}

/**
 * Get active deliveries for a partner
 */
export async function getActiveDeliveries(deliveryPartnerId: string) {
  try {
    const { data, error, count } = await supabase
      .from("DeliveryAssignments")
      .select("*, Orders(*)", { count: "exact" })
      .eq("delivery_partner_id", deliveryPartnerId)
      .in("status", ["accepted", "picked_up"])
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching active deliveries:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Get delivery history
 */
export async function getDeliveryHistory(deliveryPartnerId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("DeliveryAssignments")
      .select("*, Orders(*)", { count: "exact" })
      .eq("delivery_partner_id", deliveryPartnerId)
      .in("status", ["delivered", "failed"])
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching delivery history:", error)
    return { data: null, error, count: 0 }
  }
}
