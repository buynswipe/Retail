import { createClient } from "@supabase/supabase-js"

// Add this function to check for localStorage values in the browser environment
function getBrowserEnvVar(key: string): string | undefined {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key) || undefined
  }
  return undefined
}

// Update the supabaseUrl and supabaseAnonKey variables to check localStorage
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  getBrowserEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
  "https://your-project.supabase.co"

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || getBrowserEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "your-anon-key"

// Update the isMissingEnvVars check to include localStorage values
const isMissingEnvVars =
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || getBrowserEnvVar("NEXT_PUBLIC_SUPABASE_URL")) ||
  !(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || getBrowserEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"))

// Create the Supabase client
export const supabase = isMissingEnvVars ? createMockSupabaseClient() : createClient(supabaseUrl, supabaseAnonKey)

// Re-export createClient for use in other modules
export { createClient }

// Mock Supabase client for development/preview when environment variables are not available
function createMockSupabaseClient() {
  console.warn(
    "Using mock Supabase client. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables for production.",
  )

  return {
    from: (table: string) => ({
      insert: () => Promise.resolve({ data: null, error: null }),
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
    auth: {
      signIn: () => Promise.resolve({ user: null, session: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: null }),
    },
  }
}

export type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

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
}

export interface PlatformSettings {
  id: number
  commission_percentage: number
  commission_gst_rate: number
  delivery_charge: number
  delivery_gst_rate: number
  effective_from: string
  created_by: string
}

export interface Order {
  id: string
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
  user_id?: string
  type: "order" | "payment" | "chat" | "system"
  message: string
  message_hindi?: string
  priority: "low" | "medium" | "high"
  is_read: boolean
  created_at: string
}
