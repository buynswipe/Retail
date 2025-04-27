import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create a standard Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create an admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Define user roles
export type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

// Database types
export interface User {
  id: string
  phone_number: string
  email?: string
  role: UserRole
  name?: string
  business_name?: string
  pin_code?: string
  gst_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  vehicle_type?: "bike" | "van"
  is_approved: boolean
  created_at: string
  updated_at: string
}
