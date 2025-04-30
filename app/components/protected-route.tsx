"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only run this check after the initial loading is complete
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // If role check is required
      if (requiredRole && user) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

        // If user doesn't have the required role
        if (!roles.includes(user.role)) {
          // Redirect to their appropriate dashboard
          switch (user.role) {
            case "retailer":
              router.push("/retailer/dashboard")
              break
            case "wholesaler":
              router.push("/wholesaler/dashboard")
              break
            case "delivery":
              router.push("/delivery/dashboard")
              break
            case "admin":
              router.push("/admin/dashboard")
              break
            default:
              router.push("/login")
          }
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  // Show nothing while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If not authenticated after loading, don't render children
  if (!isAuthenticated && !isLoading) {
    return null
  }

  // If role is required and user doesn't have it, don't render
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role)) {
      return null
    }
  }

  // Otherwise render the protected content
  return <>{children}</>
}
