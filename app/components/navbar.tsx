"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { TranslationProvider, useTranslation } from "./translation-provider"
import LanguageToggle from "./language-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  User,
  Settings,
  Home,
  Package,
  MessageSquare,
  CreditCard,
  FileText,
  Bell,
  BarChart,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import NotificationBell from "./notification-bell"

function NavbarContent() {
  const { t } = useTranslation()
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const { items } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isHomePage = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const isRetailerPage = pathname?.startsWith("/retailer")
  const isWholesalerPage = pathname?.startsWith("/wholesaler")
  const isDeliveryPage = pathname?.startsWith("/delivery")
  const isAdminPage = pathname?.startsWith("/admin")
  const isChatPage = pathname === "/chat"

  const getNavLinks = () => {
    if (isRetailerPage) {
      return [
        { href: "/retailer/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5 mr-2" /> },
        { href: "/retailer/browse", label: t("Browse Products"), icon: <Package className="h-5 w-5 mr-2" /> },
        { href: "/retailer/orders", label: t("My Orders"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/retailer/payments", label: t("Payments"), icon: <CreditCard className="h-5 w-5 mr-2" /> },
        { href: "/retailer/tax", label: t("Tax Reports"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/chat", label: t("Chat"), icon: <MessageSquare className="h-5 w-5 mr-2" /> },
        { href: "/retailer/analytics", label: t("Analytics"), icon: <BarChart className="h-5 w-5 mr-2" /> },
      ]
    } else if (isWholesalerPage) {
      return [
        { href: "/wholesaler/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5 mr-2" /> },
        { href: "/wholesaler/products", label: t("My Products"), icon: <Package className="h-5 w-5 mr-2" /> },
        { href: "/wholesaler/orders", label: t("Orders"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/wholesaler/payments", label: t("Payments"), icon: <CreditCard className="h-5 w-5 mr-2" /> },
        { href: "/wholesaler/tax", label: t("Tax Reports"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/chat", label: t("Chat"), icon: <MessageSquare className="h-5 w-5 mr-2" /> },
        { href: "/wholesaler/analytics", label: t("Analytics"), icon: <BarChart className="h-5 w-5 mr-2" /> },
      ]
    } else if (isDeliveryPage) {
      return [
        { href: "/delivery/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5 mr-2" /> },
        { href: "/delivery/assignments", label: t("Find Assignments"), icon: <Package className="h-5 w-5 mr-2" /> },
        { href: "/delivery/active", label: t("Active Deliveries"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/delivery/history", label: t("History"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/chat", label: t("Chat"), icon: <MessageSquare className="h-5 w-5 mr-2" /> },
        { href: "/delivery/analytics", label: t("Analytics"), icon: <BarChart className="h-5 w-5 mr-2" /> },
      ]
    } else if (isAdminPage) {
      return [
        { href: "/admin/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5 mr-2" /> },
        { href: "/admin/users", label: t("Users"), icon: <User className="h-5 w-5 mr-2" /> },
        { href: "/admin/orders", label: t("Orders"), icon: <FileText className="h-5 w-5 mr-2" /> },
        { href: "/admin/settings", label: t("Settings"), icon: <Settings className="h-5 w-5 mr-2" /> },
        { href: "/admin/analytics", label: t("Analytics"), icon: <BarChart className="h-5 w-5 mr-2" },
      ]
    } else if (isChatPage) {
      return [
        {
          href:
            user?.role === "retailer"
              ? "/retailer/dashboard"
              : user?.role === "wholesaler"
                ? "/wholesaler/dashboard"
                : user?.role === "delivery"
                  ? "/delivery/dashboard"
                  : "/admin/dashboard",
          label: t("Dashboard"),
          icon: <Home className="h-5 w-5 mr-2" />,
        },
      ]
    } else {
      return [{ href: "/", label: t("Home"), icon: <Home className="h-5 w-5 mr-2" /> }]
    }
  }

  const navLinks = getNavLinks()

  const handleLogout = async () => {
    await logout()
  }

  const getProfileLink = () => {
    if (user?.role === "retailer") return "/retailer/profile"
    if (user?.role === "wholesaler") return "/wholesaler/profile"
    if (user?.role === "delivery") return "/delivery/profile"
    if (user?.role === "admin") return "/admin/profile"
    return "/"
  }

  const getDashboardLink = () => {
    if (user?.role === "retailer") return "/retailer/dashboard"
    if (user?.role === "wholesaler") return "/wholesaler/dashboard"
    if (user?.role === "delivery") return "/delivery/dashboard"
    if (user?.role === "admin") return "/admin/dashboard"
    return "/"
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled || !isHomePage ? "bg-white shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">RetailBandhu</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === link.href ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {user && <NotificationBell />}

            <LanguageToggle />

            {user && user.role === "retailer" && (
              <Link href="/retailer/checkout">
                <Button variant="ghost" className="relative p-2 h-10 w-10">
                  <ShoppingCart className="h-5 w-5" />
                  {items.length > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
                      variant="destructive"
                    >
                      {items.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt={user.name || "User"} />
                      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name || "User"}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink()}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isAuthPage ? (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">{t("Login")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">{t("Sign Up")}</Link>
                </Button>
              </div>
            ) : null}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-4">
                      <span className="text-lg font-bold text-blue-600">RetailBandhu</span>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                    </div>
                    <nav className="flex flex-col space-y-1 mt-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
                            pathname === link.href ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {link.icon}
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="mt-auto">
                      {user ? (
                        <div className="border-t pt-4 mt-4">
                          <div className="flex items-center px-3 py-2">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src="/placeholder.svg" alt={user.name || "User"} />
                              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name || "User"}</p>
                              <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-3 py-2 mt-2"
                            onClick={handleLogout}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </div>
                      ) : !isAuthPage ? (
                        <div className="border-t pt-4 mt-4 space-y-2">
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">{t("Login")}</Link>
                          </Button>
                          <Button asChild className="w-full">
                            <Link href="/signup">{t("Sign Up")}</Link>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function Navbar() {
  return (
    <TranslationProvider>
      <NavbarContent />
    </TranslationProvider>
  )
}
