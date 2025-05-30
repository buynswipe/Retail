import { supabase } from "./supabase-client"
import type { User, UserRole } from "./types"

export interface UserUpdateData {
  name?: string
  business_name?: string
  pin_code?: string
  gst_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  vehicle_type?: "bike" | "van"
  profile_image_url?: string
}

// Get user by ID
export async function getUserById(userId: string): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { data: null, error }
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  userData: UserUpdateData,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user profile:", error)
      return { success: false, error }
    }

    // Update local storage if available
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const parsedUser = JSON.parse(currentUser)
        const updatedUser = { ...parsedUser, ...userData }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error }
  }
}

// Get users by role
export async function getUsersByRole(
  role: UserRole,
  isApproved?: boolean,
): Promise<{ data: User[] | null; error: any }> {
  try {
    let query = supabase.from("users").select("*").eq("role", role)

    if (isApproved !== undefined) {
      query = query.eq("is_approved", isApproved)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users by role:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching users by role:", error)
    return { data: null, error }
  }
}

// Approve or reject user
export async function updateUserApprovalStatus(
  userId: string,
  isApproved: boolean,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        is_approved: isApproved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user approval status:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user approval status:", error)
    return { success: false, error }
  }
}

// Upload profile image
export async function uploadProfileImage(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `profile-images/${fileName}`

    const { error } = await supabase.storage.from("profile-images").upload(filePath, file)

    if (error) {
      console.error("Error uploading profile image:", error)
      return { url: null, error }
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return { url: null, error }
  }
}

// Get users by pin code
export async function getUsersByPinCode(
  pinCode: string,
  role?: UserRole,
): Promise<{ data: User[] | null; error: any }> {
  try {
    let query = supabase.from("users").select("*").eq("pin_code", pinCode).eq("is_approved", true)

    if (role) {
      query = query.eq("role", role)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users by pin code:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching users by pin code:", error)
    return { data: null, error }
  }
}

// Search users
export async function searchUsers(searchTerm: string, role?: UserRole): Promise<{ data: User[] | null; error: any }> {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)

    if (role) {
      query = query.eq("role", role)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      console.error("Error searching users:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error searching users:", error)
    return { data: null, error }
  }
}

// Get user statistics
export async function getUserStatistics(): Promise<{
  data: {
    total_users: number
    retailers: number
    wholesalers: number
    delivery_partners: number
    pending_approvals: number
  } | null
  error: any
}> {
  try {
    const { count: totalUsers, error: totalError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (totalError) {
      console.error("Error fetching total users:", totalError)
      return { data: null, error: totalError }
    }

    const { count: retailers, error: retailersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "retailer")

    if (retailersError) {
      console.error("Error fetching retailers count:", retailersError)
      return { data: null, error: retailersError }
    }

    const { count: wholesalers, error: wholesalersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "wholesaler")

    if (wholesalersError) {
      console.error("Error fetching wholesalers count:", wholesalersError)
      return { data: null, error: wholesalersError }
    }

    const { count: deliveryPartners, error: deliveryError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "delivery")

    if (deliveryError) {
      console.error("Error fetching delivery partners count:", deliveryError)
      return { data: null, error: deliveryError }
    }

    const { count: pendingApprovals, error: pendingError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)

    if (pendingError) {
      console.error("Error fetching pending approvals count:", pendingError)
      return { data: null, error: pendingError }
    }

    return {
      data: {
        total_users: totalUsers || 0,
        retailers: retailers || 0,
        wholesalers: wholesalers || 0,
        delivery_partners: deliveryPartners || 0,
        pending_approvals: pendingApprovals || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    return { data: null, error }
  }
}
