import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient as createServerClientSSR } from "@supabase/ssr"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create a server-specific Supabase client
export const createServerClient = () => {
  const cookieStore = cookies()

  return createServerClientSSR(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        cookieStore.set(name, value, options)
      },
      remove: (name, options) => {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}

// Create an admin client for server-side operations
export const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}
