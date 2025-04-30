"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { useTranslation } from "./translation-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PinCodeLookupProps {
  onPinCodeFound: (pinCode: string, location: LocationData) => void
  className?: string
}

export interface LocationData {
  pinCode: string
  city: string
  state: string
  country: string
  fullAddress: string
  latitude: number
  longitude: number
}

export function PinCodeLookup({ onPinCodeFound, className }: PinCodeLookupProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [manualPinCode, setManualPinCode] = useState("")
  const [geoSupported, setGeoSupported] = useState(true)

  // Check if geolocation is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoSupported(false)
      setError(t("pinCodeLookup.geoNotSupported"))
    }
  }, [t])

  // Function to get current location
  const getCurrentLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get coordinates from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords

      // Use reverse geocoding to get address details
      const locationData = await fetchLocationData(latitude, longitude)
      setLocationData(locationData)

      // Call the callback with the found pin code
      onPinCodeFound(locationData.pinCode, locationData)
    } catch (err) {
      console.error("Error getting location:", err)

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(t("pinCodeLookup.permissionDenied"))
            break
          case err.POSITION_UNAVAILABLE:
            setError(t("pinCodeLookup.positionUnavailable"))
            break
          case err.TIMEOUT:
            setError(t("pinCodeLookup.timeout"))
            break
          default:
            setError(t("pinCodeLookup.unknownError"))
        }
      } else {
        setError(t("pinCodeLookup.unknownError"))
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch location data from coordinates
  const fetchLocationData = async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      // In a real app, you would call a reverse geocoding API here
      // For demo purposes, we'll simulate a response with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // This is a simulated response - in a real app, you'd get this from an API
      // For India, you might use MapMyIndia, Google Geocoding API, or similar services

      // Simulate different PIN codes based on coordinates to demonstrate functionality
      const lastDigits = Math.floor((latitude + longitude) * 1000) % 1000
      const pinCode = `4000${lastDigits.toString().padStart(2, "0")}`

      return {
        pinCode,
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        fullAddress: `Sample Address, Mumbai, Maharashtra ${pinCode}, India`,
        latitude,
        longitude,
      }
    } catch (error) {
      console.error("Error fetching location data:", error)
      throw new Error(t("pinCodeLookup.geocodingError"))
    }
  }

  // Function to handle manual PIN code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (manualPinCode.length !== 6 || !/^\d+$/.test(manualPinCode)) {
      setError(t("pinCodeLookup.invalidPinCode"))
      return
    }

    // Create a basic location data object with the manual PIN code
    const basicLocationData: LocationData = {
      pinCode: manualPinCode,
      city: "",
      state: "",
      country: "India",
      fullAddress: "",
      latitude: 0,
      longitude: 0,
    }

    setLocationData(basicLocationData)
    onPinCodeFound(manualPinCode, basicLocationData)
    setError(null)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-lg font-semibold">{t("pinCodeLookup.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("pinCodeLookup.description")}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("pinCodeLookup.errorTitle")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {locationData && (
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">{t("pinCodeLookup.found")}</p>
              <p className="text-sm">
                {t("pinCodeLookup.pinCode")}: <span className="font-semibold">{locationData.pinCode}</span>
              </p>
              {locationData.city && (
                <p className="text-sm">
                  {t("pinCodeLookup.location")}: {locationData.city}, {locationData.state}
                </p>
              )}
            </div>
          )}

          {geoSupported && (
            <Button type="button" variant="outline" className="w-full" onClick={getCurrentLocation} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              {t("pinCodeLookup.useCurrentLocation")}
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("pinCodeLookup.or")}</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="pincode">{t("pinCodeLookup.enterManually")}</Label>
              <div className="flex gap-2">
                <Input
                  id="pincode"
                  placeholder="400001"
                  value={manualPinCode}
                  onChange={(e) => setManualPinCode(e.target.value)}
                  maxLength={6}
                  pattern="\d{6}"
                  className="flex-1"
                />
                <Button type="submit" disabled={manualPinCode.length !== 6 || !/^\d+$/.test(manualPinCode)}>
                  {t("pinCodeLookup.submit")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("pinCodeLookup.enterValidPinCode")}</p>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
