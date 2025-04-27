"use client"

import { useEffect, useState } from "react"

export function DemoAccountSetup() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function setupDemoAccounts() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/setup-demo-accounts")
        const data = await response.json()

        if (!data.success) {
          console.error("Failed to set up demo accounts:", data.error)
          setError(data.error || "Failed to set up demo accounts")
        }
      } catch (err) {
        console.error("Error setting up demo accounts:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    setupDemoAccounts()
  }, [])

  // This component doesn't render anything visible
  return null
}
