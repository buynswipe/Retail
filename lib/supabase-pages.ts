import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a client-side Supabase client for use in pages/ directory
export const createPagesSupabaseClient = () => {
  return createClientComponentClient()
}
