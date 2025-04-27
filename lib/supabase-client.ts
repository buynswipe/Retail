import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Get environment variables with fallbacks and validation
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  }
  return url || ""
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
  }
  return key || ""
}

const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key && typeof window === "undefined") {
    // Only log this on the server side
    console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }
  return key || ""
}

// Create a standard Supabase client
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Create an admin client for server-side operations
export const supabaseAdmin = createClient(getSupabaseUrl(), getServiceRoleKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Create a client-side Supabase client with cookies
// This is safe to use in both app/ and pages/ directories
export const createServerSupabaseClient = () => {
  try {
    return createClientComponentClient({
      supabaseUrl: getSupabaseUrl(),
      supabaseKey: getSupabaseAnonKey(),
    })
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    // Return a minimal client that won't crash but will fail gracefully
    return createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
}

// Export the createClientComponentClient directly for use in client components
export { createClientComponentClient }
