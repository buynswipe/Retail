"use client"

import { useEffect, useState } from "react"

export default function EnvSetup() {
  const [isSetup, setIsSetup] = useState(false)

  useEffect(() => {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      setIsSetup(true)
    } else {
      console.error(
        "Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      )
    }
  }, [])

  if (isSetup) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-90 z-50 flex items-center justify-center text-white p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Environment Setup Required</h1>
        <p className="mb-4">Please set the following environment variables in your .env.local file:</p>
        <pre className="bg-red-700 p-4 rounded text-left mb-4 overflow-auto">
          NEXT_PUBLIC_SUPABASE_URL=your_supabase_url NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
          SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
        </pre>
        <p>Then restart your development server.</p>
      </div>
    </div>
  )
}
