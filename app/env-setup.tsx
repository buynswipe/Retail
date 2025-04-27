"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

export default function EnvSetup() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if environment variables are set
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missing = requiredVars.filter((varName) => {
      const value = process.env[varName]
      return !value || value.trim() === ""
    })

    if (missing.length > 0) {
      console.error(`Missing environment variables: ${missing.join(", ")}`)
      setMissingVars(missing)
    }
  }, [])

  // Only show the error on client-side to avoid hydration issues
  if (!isClient || missingVars.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-90 z-50 flex items-center justify-center text-white p-4">
      <div className="max-w-md text-center bg-white text-red-600 p-6 rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-4">Environment Setup Required</h1>
        <p className="mb-4">The following environment variables are missing:</p>
        <ul className="bg-red-50 p-4 rounded text-left mb-4 overflow-auto">
          {missingVars.map((varName) => (
            <li key={varName} className="font-mono">
              {varName}
            </li>
          ))}
        </ul>
        <p className="mb-4">Please add these variables to your Vercel project settings or .env.local file.</p>
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          <h2 className="font-bold">How to fix this:</h2>
          <ol className="list-decimal pl-5 mt-2 text-left">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to the Environment Variables section</li>
            <li>Add each of the missing variables listed above</li>
            <li>Redeploy your application</li>
          </ol>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          After adding the variables, redeploy your application or restart your development server.
        </p>
      </div>
    </div>
  )
}
