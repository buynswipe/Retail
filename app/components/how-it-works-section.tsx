"use client"

import { useTranslation } from "./translation-provider"
import { UserPlus, ShoppingCart, Truck, LineChart } from "lucide-react"

export default function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t("how.title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1: Join */}
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-6 rounded-full mb-4">
              <UserPlus className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">{t("how.step1")}</h3>
            <p className="text-lg">Sign up as retailer, wholesaler, or delivery partner</p>
          </div>

          {/* Step 2: Order */}
          <div className="flex flex-col items-center text-center">
            <div className="bg-orange-100 p-6 rounded-full mb-4">
              <ShoppingCart className="h-16 w-16 text-orange-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">{t("how.step2")}</h3>
            <p className="text-lg">Place or receive orders with easy catalog browsing</p>
          </div>

          {/* Step 3: Deliver */}
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 p-6 rounded-full mb-4">
              <Truck className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">{t("how.step3")}</h3>
            <p className="text-lg">Dispatch and deliver with GPS navigation and OTP verification</p>
          </div>

          {/* Step 4: Track */}
          <div className="flex flex-col items-center text-center">
            <div className="bg-purple-100 p-6 rounded-full mb-4">
              <LineChart className="h-16 w-16 text-purple-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">{t("how.step4")}</h3>
            <p className="text-lg">Monitor orders, payments, and generate tax reports</p>
          </div>
        </div>
      </div>
    </section>
  )
}
