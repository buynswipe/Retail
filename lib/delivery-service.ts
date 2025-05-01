import { supabase, supabaseAdmin } from "./supabase-client"
import type { DeliveryAssignment, DeliveryStatus } from "./types"

// Get assignments by delivery partner ID (alias for getDeliveryAssignmentsByPartner)
export async function getAssignmentsByDeliveryPartner(
  partnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  return getDeliveryAssignmentsByPartner(partnerId)
}

// Get available assignments by PIN code
export async function getAvailableAssignmentsByPinCode(
  pinCode: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (*,
          retailer:retailer_id (*),
          wholesaler:wholesaler_id (*)
        )
      `)
      .is("delivery_partner_id", null)
      .eq("status", "pending")
      .eq("order.retailer.pin_code", pinCode)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching available assignments by PIN code:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching available assignments by PIN code:", error)
    return { data: null, error }
  }
}

// Accept delivery assignment
export async function acceptDeliveryAssignment(
  assignmentId: string,
  partnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("delivery_assignments")
      .update({
        delivery_partner_id: partnerId,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .is("delivery_partner_id", null)

    if (error) {
      console.error("Error accepting delivery assignment:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error accepting delivery assignment:", error)
    return { success: false, error }
  }
}

// Get delivery assignment by order ID (alias for getDeliveryAssignmentByOrder)
export async function getDeliveryAssignmentByOrderId(
  orderId: string,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  return getDeliveryAssignmentByOrder(orderId)
}

// Get all delivery assignments (admin function)
export async function getDeliveryAssignments(): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (*,
          retailer:retailer_id (*),
          wholesaler:wholesaler_id (*)
        ),
        delivery_partner:delivery_partner_id (*)
      `)
      .order("created_at", { ascending: false })

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

// Get delivery assignments by delivery partner ID
export async function getDeliveryAssignmentsByPartner(
  partnerId: string,
): Promise<{ data: DeliveryAssignment[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (*,
          retailer:retailer_id (*),
          wholesaler:wholesaler_id (*)
        )
      `)
      .eq("delivery_partner_id", partnerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching delivery assignments by partner:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching delivery assignments by partner:", error)
    return { data: null, error }
  }
}

// Get delivery assignments by order ID
export async function getDeliveryAssignmentByOrder(
  orderId: string,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (*),
        delivery_partner:delivery_partner_id (*)
      `)
      .eq("order_id", orderId)
      .single()

    if (error) {
      console.error("Error fetching delivery assignment by order:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching delivery assignment by order:", error)
    return { data: null, error }
  }
}

// Create delivery assignment
export async function createDeliveryAssignment(
  orderId: string,
  deliveryCharge: number,
  deliveryChargeGst: number,
): Promise<{ data: DeliveryAssignment | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_assignments")
      .insert({
        order_id: orderId,
        status: "pending",
        delivery_charge: deliveryCharge,
        delivery_charge_gst: deliveryChargeGst,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating delivery assignment:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating delivery assignment:", error)
    return { data: null, error }
  }
}

// Assign delivery partner
export async function assignDeliveryPartner(
  assignmentId: string,
  partnerId: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabaseAdmin
      .from("delivery_assignments")
      .update({
        delivery_partner_id: partnerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)

    if (error) {
      console.error("Error assigning delivery partner:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error assigning delivery partner:", error)
    return { success: false, error }
  }
}

// Update delivery status
export async function updateDeliveryStatus(
  assignmentId: string,
  status: DeliveryStatus,
  proofImageUrl?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (proofImageUrl) {
      updateData.proof_image_url = proofImageUrl
    }

    const { error } = await supabaseAdmin.from("delivery_assignments").update(updateData).eq("id", assignmentId)

    if (error) {
      console.error("Error updating delivery status:", error)
      return { success: false, error }
    }

    // If status is completed, update the order status as well
    if (status === "completed") {
      // First get the order ID
      const { data: assignment } = await supabaseAdmin
        .from("delivery_assignments")
        .select("order_id")
        .eq("id", assignmentId)
        .single()

      if (assignment) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "delivered",
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignment.order_id)
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating delivery status:", error)
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
      console.error("Error uploading delivery proof:", error)
      return { url: null, error }
    }

    const { data } = supabase.storage.from("delivery-proofs").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading delivery proof:", error)
    return { url: null, error }
  }
}

// Get delivery statistics
export async function getDeliveryStatistics(): Promise<{
  data: {
    total_deliveries: number
    pending_deliveries: number
    active_deliveries: number
    completed_deliveries: number
    completed_today: number
    average_delivery_time: number
  } | null
  error: any
}> {
  try {
    // Get total deliveries
    const { count: totalDeliveries, error: totalError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*", { count: "exact", head: true })

    if (totalError) {
      console.error("Error fetching total deliveries:", totalError)
      return { data: null, error: totalError }
    }

    // Get pending deliveries
    const { count: pendingDeliveries, error: pendingError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingError) {
      console.error("Error fetching pending deliveries:", pendingError)
      return { data: null, error: pendingError }
    }

    // Get active deliveries
    const { count: activeDeliveries, error: activeError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")

    if (activeError) {
      console.error("Error fetching active deliveries:", activeError)
      return { data: null, error: activeError }
    }

    // Get completed deliveries
    const { count: completedDeliveries, error: completedError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    if (completedError) {
      console.error("Error fetching completed deliveries:", completedError)
      return { data: null, error: completedError }
    }

    // Get completed deliveries today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: completedToday, error: todayError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", today.toISOString())

    if (todayError) {
      console.error("Error fetching completed deliveries today:", todayError)
      return { data: null, error: todayError }
    }

    // Calculate average delivery time (in hours)
    // This is a simplified calculation and might need adjustment based on your data structure
    const { data: completedAssignments, error: avgError } = await supabaseAdmin
      .from("delivery_assignments")
      .select("created_at, updated_at")
      .eq("status", "completed")
      .limit(100) // Limit to recent 100 for performance

    let averageDeliveryTime = 0

    if (!avgError && completedAssignments && completedAssignments.length > 0) {
      const totalHours = completedAssignments.reduce((sum, assignment) => {
        const createdAt = new Date(assignment.created_at)
        const updatedAt = new Date(assignment.updated_at || assignment.created_at)
        const diffHours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        return sum + diffHours
      }, 0)

      averageDeliveryTime = totalHours / completedAssignments.length
    }

    return {
      data: {
        total_deliveries: totalDeliveries || 0,
        pending_deliveries: pendingDeliveries || 0,
        active_deliveries: activeDeliveries || 0,
        completed_deliveries: completedDeliveries || 0,
        completed_today: completedToday || 0,
        average_delivery_time: Number.parseFloat(averageDeliveryTime.toFixed(2)),
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching delivery statistics:", error)
    return { data: null, error }
  }
}

// Get nearby delivery partners for an order
export async function getNearbyDeliveryPartners(pinCode: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", "delivery")
      .eq("is_approved", true)
      .eq("pin_code", pinCode)

    if (error) {
      console.error("Error fetching nearby delivery partners:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching nearby delivery partners:", error)
    return { data: null, error }
  }
}

// Get delivery analytics by time period
export async function getDeliveryAnalytics(
  startDate: string,
  endDate: string,
): Promise<{ data: any | null; error: any }> {
  try {
    // Get deliveries in the date range
    const { data: deliveries, error } = await supabaseAdmin
      .from("delivery_assignments")
      .select(`
        *,
        order:order_id (total_amount),
        delivery_partner:delivery_partner_id (name, vehicle_type)
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (error) {
      console.error("Error fetching delivery analytics:", error)
      return { data: null, error }
    }

    // Process data for analytics
    const statusCounts = {
      pending: 0,
      accepted: 0,
      completed: 0,
      declined: 0,
    }

    const vehicleTypeCounts = {
      bike: 0,
      van: 0,
    }

    let totalDeliveryCharges = 0
    let totalDeliveryGst = 0

    deliveries?.forEach((delivery) => {
      // Count by status
      statusCounts[delivery.status as keyof typeof statusCounts]++

      // Count by vehicle type
      if (delivery.delivery_partner?.vehicle_type) {
        vehicleTypeCounts[delivery.delivery_partner.vehicle_type as keyof typeof vehicleTypeCounts]++
      }

      // Sum charges
      totalDeliveryCharges += delivery.delivery_charge || 0
      totalDeliveryGst += delivery.delivery_charge_gst || 0
    })

    return {
      data: {
        total_deliveries: deliveries?.length || 0,
        status_counts: statusCounts,
        vehicle_type_counts: vehicleTypeCounts,
        total_delivery_charges: totalDeliveryCharges,
        total_delivery_gst: totalDeliveryGst,
        deliveries: deliveries || [],
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching delivery analytics:", error)
    return { data: null, error }
  }
}

// Get delivery performance by partner
export async function getDeliveryPerformance(partnerId?: string): Promise<{ data: any | null; error: any }> {
  try {
    let query = supabaseAdmin
      .from("delivery_assignments")
      .select(`
        *,
        delivery_partner:delivery_partner_id (id, name)
      `)
      .eq("status", "completed")

    if (partnerId) {
      query = query.eq("delivery_partner_id", partnerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching delivery performance:", error)
      return { data: null, error }
    }

    // Group by partner and calculate metrics
    const partnerPerformance: Record<string, any> = {}

    data?.forEach((delivery) => {
      if (!delivery.delivery_partner) return

      const partnerId = delivery.delivery_partner.id

      if (!partnerPerformance[partnerId]) {
        partnerPerformance[partnerId] = {
          partner_id: partnerId,
          partner_name: delivery.delivery_partner.name,
          total_deliveries: 0,
          total_time: 0,
          average_time: 0,
        }
      }

      partnerPerformance[partnerId].total_deliveries++

      // Calculate delivery time
      if (delivery.updated_at) {
        const createdAt = new Date(delivery.created_at)
        const updatedAt = new Date(delivery.updated_at)
        const deliveryTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60) // in minutes
        partnerPerformance[partnerId].total_time += deliveryTime
      }
    })

    // Calculate averages
    Object.values(partnerPerformance).forEach((partner: any) => {
      if (partner.total_deliveries > 0) {
        partner.average_time = Number.parseFloat((partner.total_time / partner.total_deliveries).toFixed(2))
      }
    })

    return {
      data: Object.values(partnerPerformance),
      error: null,
    }
  } catch (error) {
    console.error("Error fetching delivery performance:", error)
    return { data: null, error }
  }
}

export default {
  getDeliveryAssignments,
  getDeliveryAssignmentsByPartner,
  getDeliveryAssignmentByOrder,
  createDeliveryAssignment,
  assignDeliveryPartner,
  updateDeliveryStatus,
  uploadDeliveryProof,
  getDeliveryStatistics,
  getNearbyDeliveryPartners,
  getDeliveryAnalytics,
  getDeliveryPerformance,
  getAssignmentsByDeliveryPartner,
  getAvailableAssignmentsByPinCode,
  acceptDeliveryAssignment,
  getDeliveryAssignmentByOrderId,
}
