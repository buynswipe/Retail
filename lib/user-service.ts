import { supabase } from "./supabase-client"
import type { User } from "./types"

// Get all wholesalers
export async function getWholesalers(): Promise<{ data: User[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "wholesaler")
      .order("business_name", { ascending: true })

    return { data, error }
  } catch (error) {
    console.error("Error getting wholesalers:", error)
    return { data: null, error }
  }
}

// Get wholesaler by ID
export async function getWholesalerById(id: string): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).eq("role", "wholesaler").single()

    return { data, error }
  } catch (error) {
    console.error("Error getting wholesaler:", error)
    return { data: null, error }
  }
}

// Get all retailers
export async function getRetailers(): Promise<{ data: User[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "retailer")
      .order("business_name", { ascending: true })

    return { data, error }
  } catch (error) {
    console.error("Error getting retailers:", error)
    return { data: null, error }
  }
}

// Get retailer by ID
export async function getRetailerById(id: string): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).eq("role", "retailer").single()

    return { data, error }
  } catch (error) {
    console.error("Error getting retailer:", error)
    return { data: null, error }
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  profileData: Partial<User>,
): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { data: null, error }
  }
}

// Upload profile image
export async function uploadProfileImage(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `profile-images/${fileName}`

    const { error } = await supabase.storage.from("user-images").upload(filePath, file)

    if (error) {
      return { url: null, error }
    }

    const { data } = supabase.storage.from("user-images").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { url: null, error }
  }
}

// Add the missing getUserProfile function
export async function getUserProfile(userId: string): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return { data: null, error }
  }
}
