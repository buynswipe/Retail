"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Navbar from "@/app/components/navbar"
import { useTranslation } from "@/app/components/translation-provider"

export default function PaymentErrorPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("message") || "An error occurred during payment processing"

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">{t("Payment Failed")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-6">{t(errorMessage)}</p>
              <p className="text-center text-sm text-gray-500">
                {t("Your payment could not be processed. Please try again or choose a different payment method.")}
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/retailer/browse">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("Continue Shopping")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/retailer/checkout/payment">{t("Try Again")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
