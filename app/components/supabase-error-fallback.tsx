"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SupabaseErrorFallback() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    // Check if Supabase URL and key are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setHasError(true)
      setErrorMessage(
        !supabaseUrl && !supabaseKey
          ? "Supabase URL and key are missing"
          : !supabaseUrl
            ? "Supabase URL is missing"
            : "Supabase key is missing",
      )
    }
  }, [])

  if (!hasError) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-red-500 p-4 flex justify-center">
          <AlertTriangle className="text-white" size={48} />
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            We couldn't initialize the Supabase client because of missing configuration.
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-600 font-medium">{errorMessage}</p>
          </div>
          <p className="text-gray-600 mb-6">
            Please check your environment variables and make sure they are correctly set in your Vercel project
            settings.
          </p>
          <div className="flex justify-between">
            <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
              Go to Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
