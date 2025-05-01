"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import ProtectedRoute from "@/app/components/protected-route"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto px-4 py-8">
        <AdminTabs />
        {children}
      </div>
    </ProtectedRoute>
  )
}

function AdminTabs() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  return (
    <Tabs value={pathname} className="mb-8">
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="/admin/dashboard" asChild>
          <Link href="/admin/dashboard" className={isActive("/admin/dashboard") ? "data-[state=active]" : ""}>
            Dashboard
          </Link>
        </TabsTrigger>
        <TabsTrigger value="/admin/users" asChild>
          <Link href="/admin/users" className={isActive("/admin/users") ? "data-[state=active]" : ""}>
            Users
          </Link>
        </TabsTrigger>
        <TabsTrigger value="/admin/orders" asChild>
          <Link href="/admin/orders" className={isActive("/admin/orders") ? "data-[state=active]" : ""}>
            Orders
          </Link>
        </TabsTrigger>
        <TabsTrigger value="/admin/delivery" asChild>
          <Link href="/admin/delivery" className={isActive("/admin/delivery") ? "data-[state=active]" : ""}>
            Delivery
          </Link>
        </TabsTrigger>
        <TabsTrigger value="/admin/analytics" asChild>
          <Link href="/admin/analytics" className={isActive("/admin/analytics") ? "data-[state=active]" : ""}>
            Analytics
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
