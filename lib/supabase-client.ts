import { createClient } from "@supabase/supabase-js"

// Define user roles
export type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

// Get environment variables with fallbacks to prevent runtime errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Only log in browser to avoid SSR issues
  if (isBrowser) {
    console.error("Missing required environment variables for Supabase client")
  }
}

// Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Supabase admin client (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
})

// Database types
export interface User {
  id: string
  phone_number: string
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

export interface PlatformSettings {
  id: number
  commission_percentage: number
  commission_gst_rate: number
  delivery_charge: number
  delivery_gst_rate: number
  effective_from: string
  created_by: string
  created_at: string
}

export interface Product {
  id: string
  wholesaler_id: string
  name: string
  description?: string
  price: number
  stock_quantity: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category?: string
  unit_size?: number
  unit_type?: string
  discount_percentage?: number
}

export interface Order {
  id: string
  order_number: string
  retailer_id: string
  wholesaler_id: string
  total_amount: number
  status: "placed" | "confirmed" | "rejected" | "dispatched" | "delivered"
  payment_method: "cod" | "upi"
  payment_status: "pending" | "completed"
  commission: number
  commission_gst: number
  delivery_charge: number
  delivery_charge_gst: number
  wholesaler_payout: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface DeliveryAssignment {
  id: string
  order_id: string
  delivery_partner_id: string
  status: "pending" | "accepted" | "declined" | "completed"
  delivery_charge: number
  delivery_charge_gst: number
  otp?: string
  proof_image_url?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: "cod" | "upi"
  payment_status: "pending" | "completed" | "failed"
  transaction_id?: string
  reference_id: string
  upi_id?: string
  payment_date?: string
  collected_by?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: "order" | "payment" | "chat" | "system"
  message: string
  message_hindi?: string
  priority: "low" | "medium" | "high"
  is_read: boolean
  created_at: string
}
