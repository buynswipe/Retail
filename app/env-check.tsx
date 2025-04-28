"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function EnvironmentCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_APP_URL"]

    const missing = requiredVars.filter((varName) => !process.env[varName] && !window[varName as any])

    if (missing.length > 0) {
      setMissingVars(missing)
      console.warn("Missing environment variables:", missing)
    }
  }, [])

  if (missingVars.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>The following environment variables are missing: {missingVars.join(", ")}</AlertDescription>
    </Alert>
  )
}
