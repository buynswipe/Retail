"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "./translation-provider"
import { Search, MapPin, Store, Phone, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PinCodeLookup } from "./pin-code-lookup"
import { isValidPinCode } from "@/lib/validation"
import { searchWholesalers } from "@/lib/search-service"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/lib/types"

interface WholesalerSearchProps {
  onSelectWholesaler?: (wholesaler: User) => void
  className?: string
}

export function WholesalerSearch({ onSelectWholesaler, className }: WholesalerSearchProps) {
  const { t } = useTranslation()
  const [pinCode, setPinCode] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [wholesalers, setWholesalers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [locationDetected, setLocationDetected] = useState(false)

  // Handle pin code selection from the PinCodeLookup component
  const handlePinCodeFound = (pinCode: string) => {
    setPinCode(pinCode)
    setLocationDetected(true)
    searchWholesalersInArea(pinCode)
  }

  // Search wholesalers by pin code
  const searchWholesalersInArea = async (pinCodeToSearch: string) => {
    if (!isValidPinCode(pinCodeToSearch)) {
      setError(t("Please enter a valid 6-digit PIN code"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await searchWholesalers(pinCodeToSearch, searchQuery)

      if (result.error) {
        throw new Error(result.error)
      }

      setWholesalers(result.data || [])

      if (result.data && result.data.length === 0) {
        setError(t("No wholesalers found in this area"))
      }
    } catch (error) {
      console.error("Error searching wholesalers:", error)
      setError(t("Failed to search wholesalers. Please try again."))

      // For demo purposes, provide some sample data
      const demoWholesalers = generateDemoWholesalers(pinCodeToSearch)
      setWholesalers(demoWholesalers)
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search button click
  const handleSearch = () => {
    searchWholesalersInArea(pinCode)
  }

  // Generate demo wholesalers for testing
  const generateDemoWholesalers = (pinCode: string): User[] => {
    // Generate different wholesalers based on pin code last digit
    const lastDigit = Number.parseInt(pinCode.charAt(5))
    const count = (lastDigit % 5) + 1 // 1-5 wholesalers

    return Array.from({ length: count }, (_, i) => ({
      id: `wholesaler-${i + 1}`,
      phone_number: `98765432${i + 1}${lastDigit}`,
      email: `wholesaler${i + 1}@example.com`,
      role: "wholesaler",
      name: `${["Vikram", "Suresh", "Patel", "Sharma", "Gupta"][i]} Enterprises`,
      business_name: `${["Super", "Mega", "Prime", "Royal", "Global"][i]} Distributors`,
      pin_code: pinCode,
      gst_number: `27AADCB2230M1Z${i}`,
      is_approved: true,
      created_at: new Date().toISOString(),
      profile_image_url: i % 2 === 0 ? "/thoughtful-vikram.png" : "/thoughtful-suresh.png",
    }))
  }

  // Handle wholesaler selection
  const handleSelectWholesaler = (wholesaler: User) => {
    if (onSelectWholesaler) {
      onSelectWholesaler(wholesaler)
    }
  }

  return (
    <div className={className}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">{t("Find Wholesalers Near You")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!locationDetected ? (
            <PinCodeLookup onPinCodeFound={handlePinCodeFound} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor="pincode-search" className="text-sm font-medium mb-1 block">
                    {t("PIN Code")}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="pincode-search"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="pl-8"
                        placeholder="400001"
                        maxLength={6}
                      />
                    </div>
                    <Button onClick={handleSearch} disabled={!isValidPinCode(pinCode) || isLoading}>
                      {t("Search")}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name-search" className="text-sm font-medium mb-1 block">
                  {t("Search by name (optional)")}
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="name-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    placeholder={t("Enter business name...")}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="pt-2">
                <h3 className="font-medium mb-3">{t("Wholesalers in your area")}</h3>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : wholesalers.length > 0 ? (
                  <div className="space-y-4">
                    {wholesalers.map((wholesaler) => (
                      <div key={wholesaler.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={wholesaler.profile_image_url || ""}
                              alt={wholesaler.business_name || ""}
                            />
                            <AvatarFallback>{(wholesaler.business_name || "W").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{wholesaler.business_name}</h4>
                            <p className="text-sm text-gray-500">{wholesaler.name}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild className="ml-auto">
                            <Link href={`/retailer/browse?wholesaler=${wholesaler.id}`}>
                              <Store className="mr-1 h-4 w-4" />
                              {t("View Products")}
                            </Link>
                          </Button>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            <span>{wholesaler.pin_code}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-gray-500" />
                            <span>{wholesaler.phone_number}</span>
                          </div>
                          {wholesaler.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-gray-500" />
                              <span className="truncate">{wholesaler.email}</span>
                            </div>
                          )}
                          {wholesaler.gst_number && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                GST: {wholesaler.gst_number}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectWholesaler(wholesaler)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {t("Select Wholesaler")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : locationDetected && !isLoading && !error ? (
                  <div className="text-center py-8 text-gray-500">
                    <Store className="mx-auto h-12 w-12 opacity-20" />
                    <p className="mt-2">{t("Search for wholesalers in your area")}</p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
