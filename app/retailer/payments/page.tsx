"use client"

import { useState } from "react"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { PaymentHistory } from "@/app/components/payment/payment-history"
import { PaymentAnalytics } from "@/app/components/analytics/payment-analytics"

function PaymentsContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("history")

  if (!user) {
    return (
      <div className="container py-10">
        <p className="text-center">Please log in to view your payment information.</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{t("Payments")}</h1>

      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">{t("Payment History")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("Analytics")}</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="history">
            <PaymentHistory userId={user.id} role="retailer" />
          </TabsContent>
          <TabsContent value="analytics">
            <PaymentAnalytics userId={user.id} role="retailer" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <TranslationProvider>
      <Navbar />
      <PaymentsContent />
    </TranslationProvider>
  )
}
