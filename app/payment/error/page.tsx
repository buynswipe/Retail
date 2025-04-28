"use client"

import { useState, useEffect } from "react"
import { useSafeTranslation } from "@/lib/use-safe-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import Navbar from "@/app/components/navbar"

// Add a static export configuration to skip static generation
export const dynamic = "force-dynamic"

export default function PaymentErrorPage() {
  const { t, isMounted } = useSafeTranslation()
  const [errorDetails, setErrorDetails] = useState({
    code: "",
    message: "",
  })

  useEffect(() => {
    if (!isMounted) return

    // Get error details from URL params
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code") || "unknown"
    const message = params.get("message") || "An unknown error occurred during payment processing"

    setErrorDetails({ code, message })
  }, [isMounted])

  // Show a loading state during server-side rendering
  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Loading...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-red-200">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-red-600">{t("Payment Failed")}</CardTitle>
              <CardDescription className="text-center">{t("We couldn't process your payment")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <p className="text-sm text-red-800">
                  <span className="font-medium">{t("Error Code")}: </span>
                  {errorDetails.code}
                </p>
                <p className="text-sm text-red-800 mt-1">
                  <span className="font-medium">{t("Error Message")}: </span>
                  {errorDetails.message}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{t("Please try the following:")}</p>
                <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                  <li>{t("Check your payment details and try again")}</li>
                  <li>{t("Ensure you have sufficient funds in your account")}</li>
                  <li>{t("Try a different payment method")}</li>
                  <li>{t("Contact your bank if the issue persists")}</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild className="w-full">
                <Link href="/retailer/checkout">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("Return to Checkout")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t("Go to Home")}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
