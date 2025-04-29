import { supabase } from "./supabase-client"
import type { DeliveryAssignment, DeliveryStatus } from "./types"

export interface CreateAssignmentData {
  order_id: string
  delivery_charge: number
  delivery_charge_gst: number
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create a new delivery assignment
export async function createDeliveryAssignment(
  data: CreateAssignmentData,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    // Create assignment in database
    const { data: assignmentResult, error: assignmentError } = await supabase
      .from("delivery_assignments")
      .insert({
        order_id: data.order_id,
        delivery_partner_id: null, // Will be assigned later
        status: "pending",
        delivery_charge: data.delivery_charge,
        delivery_charge_gst: data.delivery_charge_gst,
        otp: null, // OTP will be generated when delivery partner is assigned
      })
      .select()
      .single()

    if (assignmentError) {
      return { data: null, error: assignmentError }
    }

    return { data: assignmentResult, error: null }
  } catch (error) {
    console.error("Error creating delivery assignment:", error)
    return { data: null, error }
  }
}

// Get delivery assignments for a delivery partner
export async function getDeliveryAssignments(
  deliveryPartnerId: string,
  status?: DeliveryStatus,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    let query = supabase
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id(*)
      `)
      .eq("delivery_partner_id", deliveryPartnerId)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching delivery assignments:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching delivery assignments:", error)
    return { data: null, error }
  }
}

// Get available delivery assignments
export async function getAvailableDeliveryAssignments(
  pinCode: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id(*),
        retailer:order(retailer_id(*))
      `)
      .is("delivery_partner_id", null)
      .eq("status", "pending")
      .eq("retailer.pin_code", pinCode)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching available delivery assignments:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching available delivery assignments:", error)
    return { data: null, error }
  }
}

// Get available delivery assignments by PIN code
export async function getAvailableAssignmentsByPinCode(
  pinCode: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          retailer_id,
          wholesaler_id,
          total_amount,
          status,
          created_at,
          retailer:users!retailer_id(id, name, business_name, pin_code),
          wholesaler:users!wholesaler_id(id, name, business_name, pin_code)
        )
      `,
      )
      .eq("status", "pending")
      .is("delivery_partner_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    // Filter assignments by PIN code (either retailer or wholesaler PIN code should match)
    const filteredData = data.filter(
      (assignment) =>
        assignment.order.retailer.pin_code === pinCode || assignment.order.wholesaler.pin_code === pinCode,
    )

    return { data: filteredData, error: null }
  } catch (error) {
    console.error("Error fetching available assignments:", error)
    return { data: null, error }
  }
}

// Get assignments by delivery partner ID
export async function getAssignmentsByDeliveryPartner(
  deliveryPartnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          retailer_id,
          wholesaler_id,
          total_amount,
          status,
          created_at,
          retailer:users!retailer_id(id, name, business_name, pin_code, phone_number),
          wholesaler:users!wholesaler_id(id, name, business_name, pin_code, phone_number)
        )
      `,
      )
      .eq("delivery_partner_id", deliveryPartnerId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching delivery partner assignments:", error)
    return { data: null, error }
  }
}

// Get assignment by ID
export async function getAssignmentById(
  assignmentId: string,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(
        `
        *,
        order:orders(
          id,
          order_number,
          retailer_id,
          wholesaler_id,
          total_amount,
          status,
          created_at,
          retailer:users!retailer_id(id, name, business_name, pin_code, phone_number),
          wholesaler:users!wholesaler_id(id, name, business_name, pin_code, phone_number)
        ),
        delivery_partner:users(id, name, phone_number)
      `,
      )
      .eq("id", assignmentId)
      .single()

    if (error) {
      return { data: null, error }
    }

    // Format the data to match our interface
    const formattedData = {
      ...data,
      delivery_partner_name: data.delivery_partner?.name,
      delivery_partner_phone: data.delivery_partner?.phone_number,
    }

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error fetching assignment details:", error)
    return { data: null, error }
  }
}

// Accept a delivery assignment
export async function acceptDeliveryAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Generate OTP for delivery verification
    const otp = generateOTP()

    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        delivery_partner_id: deliveryPartnerId,
        status: "accepted",
        otp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("status", "pending") // Only accept if still pending

    return { success: !error, error }
  } catch (error) {
    console.error("Error accepting delivery assignment:", error)
    return { success: false, error }
  }
}

// Decline a delivery assignment
export async function declineDeliveryAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        status: "declined",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("delivery_partner_id", deliveryPartnerId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error declining delivery assignment:", error)
    return { success: false, error }
  }
}

// Complete a delivery assignment
export async function completeDeliveryAssignment(
  assignmentId: string,
  deliveryPartnerId: string,
  verificationOTP: string,
  proofImageUrl?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // First, verify the assignment and OTP
    const { data: assignment, error: fetchError } = await supabase
      .from("delivery_assignments")
      .select("*")
      .eq("id", assignmentId)
      .eq("delivery_partner_id", deliveryPartnerId)
      .eq("status", "accepted")
      .single()

    if (fetchError) {
      return { success: false, error: fetchError }
    }

    // Verify OTP
    if (assignment.otp !== verificationOTP) {
      return { success: false, error: { message: "Invalid OTP. Please try again." } }
    }

    // Update assignment status
    const { error: updateError } = await supabase
      .from("delivery_assignments")
      .update({
        status: "completed",
        proof_image_url: proofImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)

    if (updateError) {
      return { success: false, error: updateError }
    }

    // Update order status to delivered
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.order_id)

    return { success: !orderError, error: orderError }
  } catch (error) {
    console.error("Error completing delivery assignment:", error)
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

// Get delivery assignment for an order
export async function getDeliveryAssignmentByOrderId(
  orderId: string,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(
        `
        *,
        delivery_partner:users(id, name, phone_number)
      `,
      )
      .eq("order_id", orderId)
      .single()

    if (error) {
      return { data: null, error }
    }

    // Format the data to match our interface
    const formattedData = {
      ...data,
      delivery_partner_name: data.delivery_partner?.name,
      delivery_partner_phone: data.delivery_partner?.phone_number,
    }

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error fetching delivery assignment for order:", error)
    return { data: null, error }
  }
}
