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

// Get assignments for a specific delivery partner
export async function getAssignmentsByDeliveryPartner(deliveryPartnerId: string) {
  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders(*)")
    .eq("delivery_partner_id", deliveryPartnerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching assignments:", error)
    throw new Error("Failed to fetch assignments")
  }

  return data
}

// Get available assignments by pin code
export async function getAvailableAssignmentsByPinCode(pinCode: string) {
  const { data, error } = await supabase
    .from("delivery_assignments")
    .select("*, orders!inner(*)")
    .eq("status", "pending")
    .eq("orders.delivery_pin_code", pinCode)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching assignments by pin code:", error)
    throw new Error("Failed to fetch assignments")
  }

  return data
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

// Get delivery assignment by order ID
export async function getDeliveryAssignmentByOrderId(orderId: string) {
  const { data, error } = await supabase.from("delivery_assignments").select("*").eq("order_id", orderId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error fetching assignment by order ID:", error)
    throw new Error("Failed to fetch assignment")
  }

  return data
}

// Accept an assignment
export async function acceptAssignment(assignmentId: string, deliveryPartnerId: string) {
  const { error } = await supabase
    .from("delivery_assignments")
    .update({ status: "accepted", delivery_partner_id: deliveryPartnerId })
    .eq("id", assignmentId)
    .eq("status", "pending")

  if (error) {
    console.error("Error accepting assignment:", error)
    throw new Error("Failed to accept assignment")
  }

  return { success: true }
}

// Alias for acceptAssignment to match the required export
export const acceptDeliveryAssignment = acceptAssignment

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

// Create a new delivery assignment
export async function createAssignment(assignment: Omit<DeliveryAssignment, "id" | "created_at" | "updated_at">) {
  const { error } = await supabaseAdmin.from("delivery_assignments").insert(assignment)

  if (error) {
    console.error("Error creating assignment:", error)
    throw new Error("Failed to create assignment")
  }

  return { success: true }
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
