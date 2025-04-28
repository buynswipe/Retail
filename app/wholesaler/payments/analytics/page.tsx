"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { PaymentAnalyticsDashboard } from "@/app/components/payment/payment-analytics"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function WholesalerPaymentAnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "wholesaler") {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <Button variant="outline" asChild className="mb-2">
                <Link href="/wholesaler/payments/dashboard">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("Back to Payments")}
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">{t("Payment Analytics")}</h1>
              <p className="text-gray-500">{t("Analyze your payment trends and patterns")}</p>
            </div>
            <Button>
              <Download className="mr-2 h-5 w-5" />
              {t("Export Report")}
            </Button>
          </div>

          <PaymentAnalyticsDashboard userId={user.id} userType="wholesaler" />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
