"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function EnvChecker() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check required environment variables
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

  if (!isClient || missingVars.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Missing Environment Variables</AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <p>The following environment variables are missing:</p>
            <ul className="list-disc pl-5 mt-2">
              {missingVars.map((varName) => (
                <li key={varName} className="font-mono text-sm">
                  {varName}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Please add these variables to your Vercel project settings or .env.local file.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
