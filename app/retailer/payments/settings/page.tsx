"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { PaymentSettings } from "@/app/components/payment/payment-settings"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RetailerPaymentSettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "retailer") {
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
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-2">
              <Link href="/retailer/payments/dashboard">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Back to Payments")}
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{t("Payment Settings")}</h1>
            <p className="text-gray-500">{t("Manage your payment preferences and settings")}</p>
          </div>

          <PaymentSettings userId={user.id} userType="retailer" />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
