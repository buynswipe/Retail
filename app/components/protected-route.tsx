"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User is not logged in, redirect to login
        router.push(`/login?redirectTo=${encodeURIComponent(pathname || "/")}`)
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have the required role
        router.push("/unauthorized")
      } else {
        // User is authorized
        setIsAuthorized(true)
      }
    }
  }, [user, isLoading, router, pathname, allowedRoles])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 mt-20">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}
