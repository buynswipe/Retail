"use client"

import { useEffect, useState } from "react"

export default function EnvSetup() {
  const [isSetup, setIsSetup] = useState(true) // Default to true to avoid flashing error message
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // Check if environment variables are set
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missing = requiredVars.filter((varName) => {
      const value = process.env[varName]
      return !value || value.trim() === ""
    })

    if (missing.length > 0) {
      setIsSetup(false)
      setMissingVars(missing)
      console.error(`Environment variables not set: ${missing.join(", ")}`)
    } else {
      setIsSetup(true)
    }
  }, [])

  if (isSetup) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-90 z-50 flex items-center justify-center text-white p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Environment Setup Required</h1>
        <p className="mb-4">Please set the following environment variables:</p>
        <pre className="bg-red-700 p-4 rounded text-left mb-4 overflow-auto">{missingVars.join("\n")}</pre>
        <p>Then restart your development server.</p>
      </div>
    </div>
  )
}
