import { supabase } from "./supabase-client"
import type { DeliveryAssignment } from "./supabase-client"

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Get pending delivery assignments
export async function getPendingAssignments(): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select("*, orders(*)")
      .eq("status", "pending")
      .is("delivery_partner_id", null)
      .order("created_at", { ascending: true })

    return { data, error }
  } catch (error) {
    console.error("Error getting pending assignments:", error)
    return { data: null, error }
  }
}

// Accept a delivery assignment
export async function acceptAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        delivery_partner_id: deliveryPartnerId,
        status: "accepted",
        otp: generateOtp(),
      })
      .eq("id", assignmentId)
      .eq("status", "pending")

    return { success: !error, error }
  } catch (error) {
    console.error("Error accepting assignment:", error)
    return { success: false, error }
  }
}

// Decline a delivery assignment
export async function declineAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        status: "declined",
      })
      .eq("id", assignmentId)
      .eq("delivery_partner_id", deliveryPartnerId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error declining assignment:", error)
    return { success: false, error }
  }
}

// Get active assignments for a delivery partner
export async function getActiveAssignments(
  deliveryPartnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select("*, orders(*)")
      .eq("delivery_partner_id", deliveryPartnerId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting active assignments:", error)
    return { data: null, error }
  }
}

// Get assignment history for a delivery partner
export async function getAssignmentHistory(
  deliveryPartnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select("*, orders(*)")
      .eq("delivery_partner_id", deliveryPartnerId)
      .in("status", ["completed", "declined"])
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting assignment history:", error)
    return { data: null, error }
  }
}

// Complete a delivery assignment
export async function completeAssignment(
  assignmentId: string,
  otp: string,
  proofImageUrl?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Verify OTP
    const { data: assignment, error: fetchError } = await supabase
      .from("delivery_assignments")
      .select("otp, order_id")
      .eq("id", assignmentId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError }
    }

    if (assignment.otp !== otp) {
      return { success: false, error: "Invalid OTP. Please try again." }
    }

    // Update assignment status
    const updates: any = {
      status: "completed",
    }

    if (proofImageUrl) {
      updates.proof_image_url = proofImageUrl
    }

    const { error: updateError } = await supabase.from("delivery_assignments").update(updates).eq("id", assignmentId)

    if (updateError) {
      return { success: false, error: updateError }
    }

    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", assignment.order_id)

    return { success: !orderError, error: orderError }
  } catch (error) {
    console.error("Error completing assignment:", error)
    return { success: false, error }
  }
}

// Upload delivery proof image
export async function uploadDeliveryProof(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `delivery-proofs/${fileName}`

    const { error } = await supabase.storage.from("delivery-proofs").upload(filePath, file)

    if (error) {
      return { url: null, error }
    }

    const { data } = supabase.storage.from("delivery-proofs").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading delivery proof:", error)
    return { url: null, error }
  }
}

// Get assignments by delivery partner ID
export async function getAssignmentsByDeliveryPartner(
  deliveryPartnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select("*, orders(*)")
      .eq("delivery_partner_id", deliveryPartnerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting delivery partner assignments:", error)
    return { data: null, error }
  }
}

// Get available assignments by pin code
export async function getAvailableAssignmentsByPinCode(
  pinCode: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select("*, orders!inner(*)")
      .eq("status", "pending")
      .is("delivery_partner_id", null)
      .ilike("orders.delivery_pin_code", pinCode)
      .order("created_at", { ascending: true })

    return { data, error }
  } catch (error) {
    console.error("Error getting available assignments by pin code:", error)
    return { data: null, error }
  }
}

// Accept delivery assignment (alias for acceptAssignment for compatibility)
export async function acceptDeliveryAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  return acceptAssignment(assignmentId, deliveryPartnerId)
}

// Get delivery assignment by order ID
export async function getDeliveryAssignmentByOrderId(
  orderId: string,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    const { data, error } = await supabase.from("delivery_assignments").select("*").eq("order_id", orderId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting delivery assignment by order ID:", error)
    return { data: null, error }
  }
}
