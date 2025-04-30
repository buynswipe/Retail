"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Home, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/navigation-utils"
import Navbar from "./components/navbar"
import { TranslationProvider } from "./components/translation-provider"

export default function NotFound() {
  const router = useRouter()
  const { user } = useAuth()

  // Attempt to redirect to role-specific dashboard if user is logged in
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        router.push(getDashboardPath(user.role, "/"))
      }, 5000) // Auto-redirect after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [user, router])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    const dashboardPath = getDashboardPath(user?.role, "/")
    router.push(dashboardPath)
  }

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Page not found</CardTitle>
              <CardDescription>
                The page you're looking for doesn't exist or you don't have access to it.
                {user && <span className="block mt-2">You'll be redirected to your dashboard in a few seconds.</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Here are some helpful links:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <a href="/" className="text-blue-500 hover:underline">
                      Home page
                    </a>
                  </li>
                  {user?.role === "retailer" && (
                    <>
                      <li>
                        <a href="/retailer/dashboard" className="text-blue-500 hover:underline">
                          Retailer Dashboard
                        </a>
                      </li>
                      <li>
                        <a href="/retailer/browse" className="text-blue-500 hover:underline">
                          Browse Products
                        </a>
                      </li>
                    </>
                  )}
                  {user?.role === "wholesaler" && (
                    <>
                      <li>
                        <a href="/wholesaler/dashboard" className="text-blue-500 hover:underline">
                          Wholesaler Dashboard
                        </a>
                      </li>
                      <li>
                        <a href="/wholesaler/products" className="text-blue-500 hover:underline">
                          My Products
                        </a>
                      </li>
                    </>
                  )}
                  {user?.role === "delivery" && (
                    <>
                      <li>
                        <a href="/delivery/dashboard" className="text-blue-500 hover:underline">
                          Delivery Dashboard
                        </a>
                      </li>
                      <li>
                        <a href="/delivery/assignments" className="text-blue-500 hover:underline">
                          Find Assignments
                        </a>
                      </li>
                    </>
                  )}
                  {user?.role === "admin" && (
                    <>
                      <li>
                        <a href="/admin/dashboard" className="text-blue-500 hover:underline">
                          Admin Dashboard
                        </a>
                      </li>
                      <li>
                        <a href="/admin/users" className="text-blue-500 hover:underline">
                          Manage Users
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>
              <Button onClick={handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                {user ? "Dashboard" : "Home"}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </TranslationProvider>
  )
}
