"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import LanguageToggle from "./language-toggle"
import { Home, ShoppingBag, MessageSquare, FileText, Menu, User } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return "/login"

    switch (user.role) {
      case "admin":
        return "/admin/dashboard"
      case "retailer":
        return "/retailer/dashboard"
      case "wholesaler":
        return "/wholesaler/dashboard"
      case "delivery":
        return "/delivery/dashboard"
      default:
        return "/login"
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-blue-600">RetailBandhu</span>
          </Link>

          <div className="flex items-center space-x-2">
            <LanguageToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="hidden md:flex space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.name || user.phone}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="ghost" className="text-lg font-medium">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="text-lg font-medium bg-blue-500 hover:bg-blue-600">
                    <Link href="/signup">Join Now</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white p-4 border-b">
            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  <div className="px-2 py-1 text-sm text-gray-500">
                    Signed in as <span className="font-semibold">{user.name || user.phone}</span>
                  </div>
                  <Button asChild variant="ghost" className="text-lg font-medium justify-start">
                    <Link href={getDashboardLink()}>Dashboard</Link>
                  </Button>
                  <Button asChild variant="ghost" className="text-lg font-medium justify-start">
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button variant="ghost" className="text-lg font-medium justify-start" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="text-lg font-medium justify-start">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="text-lg font-medium bg-blue-500 hover:bg-blue-600">
                    <Link href="/signup">Join Now</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
        <div className="flex justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-1 flex-col items-center py-2 ${isActive("/dashboard") ? "text-blue-600" : "text-gray-600"}`}
          >
            <Home className="h-7 w-7" />
            <span className="text-sm">Home</span>
          </Link>
          <Link
            href="/orders"
            className={`flex flex-1 flex-col items-center py-2 ${isActive("/orders") ? "text-blue-600" : "text-gray-600"}`}
          >
            <ShoppingBag className="h-7 w-7" />
            <span className="text-sm">Orders</span>
          </Link>
          <Link
            href="/chat"
            className={`flex flex-1 flex-col items-center py-2 ${isActive("/chat") ? "text-blue-600" : "text-gray-600"}`}
          >
            <MessageSquare className="h-7 w-7" />
            <span className="text-sm">Chat</span>
          </Link>
          <Link
            href="/tax"
            className={`flex flex-1 flex-col items-center py-2 ${isActive("/tax") ? "text-blue-600" : "text-gray-600"}`}
          >
            <FileText className="h-7 w-7" />
            <span className="text-sm">Tax</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
