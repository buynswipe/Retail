"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "./translation-provider"
import LanguageToggle from "./language-toggle"
import { ThemeToggle } from "@/app/components/theme-toggle"
import NotificationBell from "./notification-bell"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Navbar() {
  const { user, setUser } = useAuth()
  const { t } = useTranslation()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Skip rendering navbar on certain pages
  if (pathname === "/unauthorized") return null

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const navItems = [
    { label: t("home"), path: "/", roles: ["admin", "retailer", "wholesaler", "delivery"] },
    { label: t("dashboard"), path: `/${user?.role}/dashboard`, roles: ["retailer", "wholesaler", "delivery"] },
    { label: t("dashboard"), path: "/admin/dashboard", roles: ["admin"] },
    { label: t("browse"), path: "/retailer/browse", roles: ["retailer"] },
    { label: t("orders"), path: "/retailer/orders", roles: ["retailer"] },
    { label: t("orders"), path: "/wholesaler/orders", roles: ["wholesaler"] },
    { label: t("products"), path: "/wholesaler/products", roles: ["wholesaler"] },
    { label: t("assignments"), path: "/delivery/assignments", roles: ["delivery"] },
    { label: t("active.deliveries"), path: "/delivery/active", roles: ["delivery"] },
    { label: t("delivery.history"), path: "/delivery/history", roles: ["delivery"] },
    { label: t("users"), path: "/admin/users", roles: ["admin"] },
    { label: t("roles"), path: "/admin/roles", roles: ["admin"] },
    { label: t("analytics"), path: "/admin/analytics", roles: ["admin"] },
    { label: t("system.status"), path: "/admin/system-status", roles: ["admin"] },
  ]

  const filteredNavItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : navItems.filter((item) => item.path === "/")

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setOpen(false)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            RetailBandhu
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                isActive(item.path)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <LanguageToggle />
          <ThemeToggle />

          {user && <NotificationBell />}

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-sm">
                  {user.name || t("profile")}
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" className="text-sm">
                {t("sign.out")}
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="text-sm">
                  {t("sign.up")}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2 text-lg font-medium rounded-md ${
                      isActive(item.path)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 text-lg font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("profile")}
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 text-lg font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("notifications")}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-2 text-lg font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {t("sign.out")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 text-lg font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 text-lg font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t("sign.up")}
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
