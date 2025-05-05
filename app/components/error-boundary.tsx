"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Home, RefreshCw, ArrowLeft, AlertTriangle, Bug, Wifi, WifiOff } from "lucide-react"
import { isOnlineEnhanced } from "@/lib/service-worker"
import { getRecoverySuggestions } from "@/lib/error-handler"

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
    icon: React.ReactNode
    suggestions: string[]
  }>({
    title: "Something went wrong",
    description: "An unexpected error occurred.",
    action: "Try again",
    icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
    suggestions: [],
  })

  const [isOnline, setIsOnline] = useState(true)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check network status
    const checkNetwork = async () => {
      setIsCheckingNetwork(true)
      const online = await isOnlineEnhanced()
      setIsOnline(online)
      setIsCheckingNetwork(false)
    }

    checkNetwork()

    // Customize error message based on error type
    if (error.message.includes("404") || error.message.includes("not found")) {
      setErrorInfo({
        title: "Page not found",
        description: "The page you're looking for doesn't exist or you don't have access to it.",
        action: "Go back",
        icon: <Bug className="h-12 w-12 text-orange-500" />,
        suggestions: [
          "Check the URL for typos",
          "Make sure you have permission to access this page",
          "The resource might have been moved or deleted",
        ],
      })
    } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
      setErrorInfo({
        title: "Unauthorized",
        description: "You don't have permission to access this page.",
        action: "Go to dashboard",
        icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
        suggestions: [
          "Log in again to refresh your session",
          "Contact support if you believe this is an error",
          "Check if your account has the necessary permissions",
        ],
      })
    } else if (error.message.includes("timeout") || error.message.includes("network")) {
      setErrorInfo({
        title: "Connection error",
        description: "Please check your internet connection and try again.",
        action: "Retry",
        icon: <WifiOff className="h-12 w-12 text-red-500" />,
        suggestions: [
          "Check your internet connection",
          "The server might be temporarily unavailable",
          "Try again in a few moments",
        ],
      })
    } else {
      // Get recovery suggestions from error handler
      const suggestions = getRecoverySuggestions(error)
      setErrorInfo({
        title: "Something went wrong",
        description: "An unexpected error occurred.",
        action: "Try again",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        suggestions,
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
    router.push("/")
  }

  const handleCheckNetwork = async () => {
    setIsCheckingNetwork(true)
    const online = await isOnlineEnhanced()
    setIsOnline(online)
    setIsCheckingNetwork(false)

    if (online) {
      // If we're online, try resetting
      reset()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">{errorInfo.icon}</div>
          <CardTitle className="text-center">{errorInfo.title}</CardTitle>
          <CardDescription className="text-center">{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error.message && process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32 mb-4">
              <code>{error.message}</code>
            </div>
          )}

          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                You appear to be offline. Some features may not work until you reconnect.
              </p>
            </div>
          )}

          {errorInfo.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex justify-between w-full">
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
          </div>

          <Button variant="ghost" size="sm" onClick={handleCheckNetwork} disabled={isCheckingNetwork} className="mt-2">
            {isCheckingNetwork ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking connection...
              </>
            ) : (
              <>
                {isOnline ? (
                  <Wifi className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="mr-2 h-4 w-4 text-red-500" />
                )}
                {isOnline ? "Online" : "Check connection"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
