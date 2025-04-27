import { NextResponse } from "next/server"

export async function GET() {
  // Check environment variables
  const envVars = {
    // Standard Supabase variables
    SUPABASE_URL: process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
      ? `✅ Set (${process.env.SUPABASE_ANON_KEY.length} chars)`
      : "❌ Missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `✅ Set (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)`
      : "❌ Missing",

    // Next.js public variables
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)`
      : "❌ Missing",

    // Runtime environment
    NODE_ENV: process.env.NODE_ENV || "not set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not set",
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: envVars,
    clientSide: {
      note: "These values will be undefined on the server. Check the browser console for client-side values.",
    },
  })
}
