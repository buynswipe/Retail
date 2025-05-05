"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "./protected-route"
import type { UserRole } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

interface RoleLayoutProps {
  children: ReactNode
  role: UserRole
}

export default function RoleLayout({ children, role }: RoleLayoutProps) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return <ProtectedRoute allowedRoles={[role]}>{children}</ProtectedRoute>
}
