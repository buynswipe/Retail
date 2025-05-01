"use client"

import { useState } from "react"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { WholesalerSearch } from "../../components/wholesaler-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, MapPin, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { User } from "@/lib/types"

function FindWholesalersContent() {
  const { t } = useTranslation()
  const [selectedWholesaler, setSelectedWholesaler] = useState<User | null>(null)

  const handleSelectWholesaler = (wholesaler: User) => {
    setSelectedWholesaler(wholesaler)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("Find Wholesalers")}</h1>
        <p className="text-gray-500 mt-2">{t("Search for wholesalers in your area based on PIN code or location")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WholesalerSearch onSelectWholesaler={handleSelectWholesaler} />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("Selected Wholesaler")}</CardTitle>
              <CardDescription>
                {selectedWholesaler
                  ? t("View products from this wholesaler")
                  : t("Select a wholesaler to view their products")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWholesaler ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedWholesaler.business_name}</h3>
                    <p className="text-sm text-gray-500">{selectedWholesaler.name}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>PIN Code: {selectedWholesaler.pin_code}</span>
                  </div>

                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href={`/retailer/browse?wholesaler=${selectedWholesaler.id}`}>
                      <Store className="mr-2 h-4 w-4" />
                      {t("Browse Products")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Store className="mx-auto h-12 w-12 opacity-20" />
                  <p className="mt-2">{t("No wholesaler selected")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t("Popular Wholesalers")}</CardTitle>
              <CardDescription>{t("Trending wholesalers in your region")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{`${["Vikram", "Suresh", "Patel"][i - 1]} Enterprises`}</p>
                      <p className="text-sm text-gray-500">PIN: 40000{i}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function FindWholesalersPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20">
          <FindWholesalersContent />
        </main>
        <Footer />
      </div>
    </TranslationProvider>
  )
}
