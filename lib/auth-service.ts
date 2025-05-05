import { supabase } from "./supabase-client"
import type { UserRole } from "./types"
import { demoUsers } from "./demo-data-service"

export interface SignUpData {
  phone: string
  role: UserRole
  name?: string
  businessName?: string
  pinCode?: string
  gstNumber?: string
  bankAccountNumber?: string
  bankIfsc?: string
  vehicleType?: "bike" | "van"
}

export interface LoginData {
  phone: string
}

export interface VerifyOtpData {
  phone: string
  otp: string
}

export interface UserData {
  id: string
  phone_number: string
  role: UserRole
  name?: string
  business_name?: string
  pin_code?: string
  is_approved: boolean
  created_at: string
}

// Send OTP via WhatsApp (simulated)
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real app, this would call a Supabase Edge Function to send OTP via WhatsApp
    // For now, we'll simulate success
    console.log(`Sending OTP to ${phone}`)

    // For demo users, always succeed
    const demoPhones = demoUsers.map((user) => user.phone_number)
    if (demoPhones.includes(phone)) {
      return { success: true }
    }

    // Check if user exists
    const { data, error } = await supabase.from("users").select("phone_number").eq("phone_number", phone).single()

    if (error && error.code !== "PGRST116") {
      return { success: false, error: error.message }
    }

    // For login, user must exist
    if (!data) {
      return { success: false, error: "User not found. Please sign up." }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending OTP:", error)
    return { success: false, error: "Failed to send OTP. Please try again." }
  }
}

// Verify OTP and sign in (simulated)
export async function verifyOtp(
  data: VerifyOtpData,
): Promise<{ success: boolean; userData?: UserData; error?: string }> {
  try {
    // Check for demo users first
    const demoUser = demoUsers.find((user) => user.phone_number === data.phone)

    if (demoUser) {
      // For demo users, any OTP works
      return {
        success: true,
        userData: {
          id: demoUser.id,
          phone_number: demoUser.phone_number,
          role: demoUser.role as UserRole,
          name: demoUser.name,
          business_name: demoUser.business_name,
          pin_code: demoUser.pin_code,
          is_approved: demoUser.is_approved,
          created_at: demoUser.created_at,
        },
      }
    }

    // For non-demo users, check if OTP is valid (always 123456 for demo)
    if (data.otp !== "123456") {
      return { success: false, error: "Invalid OTP. Please try again." }
    }

    // Get user data
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, phone_number, role, name, business_name, pin_code, is_approved, created_at")
      .eq("phone_number", data.phone)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Sign in with Supabase Auth (in a real app)
    // For now, we'll just return the user data

    return {
      success: true,
      userData: {
        id: userData.id,
        phone_number: userData.phone_number,
        role: userData.role as UserRole,
        name: userData.name,
        business_name: userData.business_name,
        pin_code: userData.pin_code,
        is_approved: userData.is_approved,
        created_at: userData.created_at,
      },
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: "Failed to verify OTP. Please try again." }
  }
}

// Sign up a new user
export async function signUp(data: SignUpData): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("phone_number")
      .eq("phone_number", data.phone)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: checkError.message }
    }

    if (existingUser) {
      return { success: false, error: "User with this phone number already exists." }
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        phone_number: data.phone,
        role: data.role,
        name: data.name,
        business_name: data.businessName,
        pin_code: data.pinCode,
        gst_number: data.gstNumber,
        bank_account_number: data.bankAccountNumber,
        bank_ifsc: data.bankIfsc,
        vehicle_type: data.vehicleType,
        is_approved: data.role === "retailer", // Auto-approve retailers
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error("Error signing up:", error)
    return { success: false, error: "Failed to sign up. Please try again." }
  }
}

// Get current user
export async function getCurrentUser(): Promise<UserData | null> {
  try {
    // In a real app, this would use Supabase Auth
    // For now, we'll check localStorage
    if (typeof window === "undefined") return null

    const storedUser = localStorage.getItem("currentUser")
    if (!storedUser) return null

    const userData = JSON.parse(storedUser) as UserData

    // Validate the user data
    if (!userData.id || !userData.phone_number || !userData.role) {
      console.warn("Invalid user data found in localStorage")
      localStorage.removeItem("currentUser")
      return null
    }

    return userData
  } catch (error) {
    console.error("Error getting current user:", error)
    localStorage.removeItem("currentUser")
    return null
  }
}

// Sign out
export async function signOut(): Promise<{ success: boolean; error?: any }> {
  try {
    // Call Supabase signOut
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out from Supabase:", error)
    }

    // Clear any local storage or cookies related to authentication
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
      localStorage.removeItem("auth_user")

      // Clear any other auth-related data
      document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    }

    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error }
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    business_name?: string
    pin_code?: string
    gst_number?: string
    bank_account_number?: string
    bank_ifsc?: string
    profile_image_url?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Update local storage
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (storedUser) {
      const userData = JSON.parse(storedUser) as UserData
      const updatedUser = {
        ...userData,
        name: data.name || userData.name,
        business_name: data.business_name || userData.business_name,
        pin_code: data.pin_code || userData.pin_code,
      }
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: "Failed to update profile. Please try again." }
  }
}

/**
 * Check if a user session is valid
 * This is useful for middleware and client-side authentication checks
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    // In a real app with Supabase Auth, we would check the session
    // For now, we'll check localStorage
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (!storedUser) return false

    // Check if the stored user data is valid
    const userData = JSON.parse(storedUser) as UserData
    if (!userData.id || !userData.phone_number || !userData.role) {
      return false
    }

    // In a real app, we would validate the session with the backend
    // For now, we'll just return true if we have valid user data
    return true
  } catch (error) {
    console.error("Error checking session validity:", error)
    return false
  }
}
