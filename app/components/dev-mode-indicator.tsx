"use client"

import { useState, useEffect } from "react"
import { Code, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DevModeIndicator() {
  const [isDev, setIsDev] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === "development")

    // Collect public environment variables
    const publicEnvVars: Record<string, string> = {}
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_")) {
        publicEnvVars[key] = process.env[key] || ""
      }
    })
    setEnvVars(publicEnvVars)
  }, [])

  if (!isDev || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-md bg-yellow-100 p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-800">
          <Code className="h-4 w-4" />
          <span className="font-medium">Development Mode</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 rounded-full p-0 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>

      <div className="mt-2 text-xs text-yellow-700">
        <p>Running in development environment</p>
        {Object.keys(envVars).length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer font-medium">Environment Variables</summary>
            <div className="mt-1 space-y-1 rounded bg-yellow-50 p-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key}>
                  <span className="font-mono">{key}:</span>{" "}
                  <span className="font-mono">
                    {value.substring(0, 20)}
                    {value.length > 20 ? "..." : ""}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
