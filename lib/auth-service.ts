import { supabase } from "./supabase-client"
import type { UserRole } from "./supabase-client"

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
  phone: string
  role: UserRole
  name?: string
  businessName?: string
  pinCode?: string
  isApproved: boolean
}

// Send OTP via WhatsApp (simulated)
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real app, this would call a Supabase Edge Function to send OTP via WhatsApp
    // For now, we'll simulate success
    console.log(`Sending OTP to ${phone}`)

    // For demo users, always succeed
    if (["1234567890", "9876543210", "9876543211", "9876543212"].includes(phone)) {
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
    // In a real app, this would verify the OTP
    // For now, we'll simulate success for demo users

    if (!["1234567890", "9876543210", "9876543211", "9876543212"].includes(data.phone)) {
      // For non-demo users, check if OTP is valid (always 123456 for demo)
      if (data.otp !== "123456") {
        return { success: false, error: "Invalid OTP. Please try again." }
      }
    }

    // Get user data
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, phone_number, role, name, business_name, pin_code, is_approved")
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
        phone: userData.phone_number,
        role: userData.role as UserRole,
        name: userData.name,
        businessName: userData.business_name,
        pinCode: userData.pin_code,
        isApproved: userData.is_approved,
      },
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: "Failed to verify OTP. Please try again." }
  }
}

// Sign up a new user
export async function signUp(data: SignUpData): Promise<{ success: boolean; error?: string }> {
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
    const { error } = await supabase.from("users").insert({
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
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
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
    const storedUser = localStorage.getItem("currentUser")
    if (!storedUser) return null

    return JSON.parse(storedUser) as UserData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Sign out
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real app, this would use Supabase Auth
    // For now, we'll just clear localStorage
    localStorage.removeItem("currentUser")
    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error: "Failed to sign out. Please try again." }
  }
}
