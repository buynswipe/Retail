"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Home, RefreshCw, ArrowLeft } from "lucide-react"
// Remove the useAuth import
// import { useAuth } from "@/lib/auth-context"
// import { getDashboardPath } from "@/lib/navigation-utils"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  children?: React.ReactNode
}

export function ErrorBoundary({ error, reset, children }: ErrorBoundaryProps) {
  const [errorInfo, setErrorInfo] = useState<{
    title: string
    description: string
    action: string
  }>({
    title: "Something went wrong",
    description: "An unexpected error occurred.",
    action: "Try again",
  })

  const router = useRouter()
  // Remove the useAuth hook usage
  // const { user } = useAuth()

  useEffect(() => {
    // Customize error message based on error type
    if (error.message.includes("404") || error.message.includes("not found")) {
      setErrorInfo({
        title: "Page not found",
        description: "The page you're looking for doesn't exist or you don't have access to it.",
        action: "Go back",
      })
    } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
      setErrorInfo({
        title: "Unauthorized",
        description: "You don't have permission to access this page.",
        action: "Go to dashboard",
      })
    } else if (error.message.includes("timeout") || error.message.includes("network")) {
      setErrorInfo({
        title: "Connection error",
        description: "Please check your internet connection and try again.",
        action: "Retry",
      })
    }

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Navigation error:", error)
    }
  }, [error])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    // Always go to the home page instead of trying to determine the dashboard path
    router.push("/")
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error.message && process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32 mb-4">
              <code>{error.message}</code>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button onClick={handleGoHome}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
