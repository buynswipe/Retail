import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import "react-native-url-polyfill/auto"

// Initialize Supabase client
const supabaseUrl = "https://your-supabase-url.supabase.co"
const supabaseAnonKey = "your-supabase-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// User types
export type UserRole = "retailer" | "wholesaler" | "delivery" | "admin"

export interface User {
  id: string
  name: string
  phone_number: string
  role: UserRole
  business_name?: string
  pin_code?: string
  gst_number?: string
  is_approved: boolean
  created_at: string
}
