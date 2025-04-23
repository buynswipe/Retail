"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import LanguageToggle from "./language-toggle"
import { Home, ShoppingBag, MessageSquare, FileText, Menu } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

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
              <Button asChild variant="ghost" className="text-lg font-medium">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="text-lg font-medium bg-blue-500 hover:bg-blue-600">
                <Link href="/signup">Join Now</Link>
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white p-4 border-b">
            <div className="flex flex-col space-y-2">
              <Button asChild variant="ghost" className="text-lg font-medium justify-start">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="text-lg font-medium bg-blue-500 hover:bg-blue-600">
                <Link href="/signup">Join Now</Link>
              </Button>
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
