import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

// Create a standard Supabase client for server components
export const createClient = cache(() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
})

// Create a server-side Supabase client with cookies
// This should only be used in Server Components
export const createServerSupabaseClient = () => {
  // This function should only be called in server components
  if (typeof window !== "undefined") {
    throw new Error("createServerSupabaseClient should only be called in Server Components")
  }

  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}
