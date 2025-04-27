import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

// Helper functions to get environment variables with validation
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

// Create a standard Supabase client for server components
export const createClient = cache(() => {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
})

// Create a server-side Supabase client with cookies
// This should only be used in Server Components
export const createServerSupabaseClient = () => {
  // This function should only be called in server components
  if (typeof window !== "undefined") {
    throw new Error("createServerSupabaseClient should only be called in Server Components")
  }

  try {
    const cookieStore = cookies()
    return createServerComponentClient({
      cookies: () => cookieStore,
      supabaseUrl: getSupabaseUrl(),
      supabaseKey: getSupabaseAnonKey(),
    })
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    // Return a minimal client that won't crash but will fail gracefully
    return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
}
