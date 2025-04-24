import type { DeliveryAssignment } from "@/types"
import { supabase } from "@/lib/supabase-client"
import { generateOtp } from "@/lib/utils"

// Get assignments by delivery partner
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
          *,
          retailer:users!retailer_id(id, name, business_name, phone_number, pin_code),
          wholesaler:users!wholesaler_id(id, name, business_name, phone_number, pin_code)
        )
      `,
      )
      .eq("delivery_partner_id", deliveryPartnerId)
      .order("created_at", { ascending: false })

    // Transform data to include delivery partner name and phone
    const transformedData = data?.map((assignment) => {
      return {
        ...assignment,
        order: {
          ...assignment.order,
          retailer_name: assignment.order.retailer?.business_name || assignment.order.retailer?.name,
          wholesaler_name: assignment.order.wholesaler?.business_name || assignment.order.wholesaler?.name,
        },
      }
    })

    return { data: transformedData || null, error }
  } catch (error) {
    console.error("Error getting assignments by delivery partner:", error)
    return { data: null, error }
  }
}

// Get available assignments by PIN code
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
          *,
          retailer:users!retailer_id(id, name, business_name, phone_number, pin_code),
          wholesaler:users!wholesaler_id(id, name, business_name, phone_number, pin_code)
        )
      `,
      )
      .eq("status", "pending")
      .is("delivery_partner_id", null)
      .order("created_at", { ascending: true })

    // Filter assignments by PIN code proximity
    // In a real app, this would use a more sophisticated algorithm
    // For now, we'll just filter by exact PIN code match
    const filteredData = data?.filter(
      (assignment) =>
        assignment.order.retailer.pin_code === pinCode || assignment.order.wholesaler.pin_code === pinCode,
    )

    // Transform data to include retailer and wholesaler names
    const transformedData = filteredData?.map((assignment) => {
      return {
        ...assignment,
        order: {
          ...assignment.order,
          retailer_name: assignment.order.retailer?.business_name || assignment.order.retailer?.name,
          wholesaler_name: assignment.order.wholesaler?.business_name || assignment.order.wholesaler?.name,
        },
      }
    })

    return { data: transformedData || null, error }
  } catch (error) {
    console.error("Error getting available assignments by PIN code:", error)
    return { data: null, error }
  }
}

// Accept a delivery assignment
export async function acceptDeliveryAssignment(
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

// Get delivery assignment by order ID
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

    // Transform data to include delivery partner name and phone
    const transformedData = data
      ? {
          ...data,
          delivery_partner_name: data.delivery_partner?.name,
          delivery_partner_phone: data.delivery_partner?.phone_number,
        }
      : null

    return { data: transformedData, error }
  } catch (error) {
    console.error("Error getting delivery assignment by order ID:", error)
    return { data: null, error }
  }
}
