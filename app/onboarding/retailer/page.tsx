"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import VoiceButton from "../../components/voice-button"
import { Camera, MapPin, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

function RetailerOnboardingForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    pinCode: "",
    gstNumber: "",
  })
  const [progress, setProgress] = useState(33)
  const router = useRouter()

  const handleVoiceInput = (text: string, field: string) => {
    setFormData({
      ...formData,
      [field]: text,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
      setProgress(66)
    } else if (step === 2) {
      setStep(3)
      setProgress(100)
    } else if (step === 3) {
      // Submit the form and redirect to dashboard
      router.push("/retailer/dashboard")
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setProgress(33)
    } else if (step === 3) {
      setStep(2)
      setProgress(66)
    }
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, this would call an API to get pin code from coordinates
          // For demo, we'll just set a dummy pin code
          setFormData({
            ...formData,
            pinCode: "400001",
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("Unable to get your location. Please enter your pin code manually.")
        },
      )
    } else {
      alert("Geolocation is not supported by your browser. Please enter your pin code manually.")
    }
  }

  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.name || !formData.shopName
    } else if (step === 2) {
      return !formData.pinCode
    }
    return false
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">Retailer Onboarding</CardTitle>
          <CardDescription className="text-xl text-center">
            {step === 1 && "Step 1: Basic Information"}
            {step === 2 && "Step 2: Location"}
            {step === 3 && "Step 3: GST Information (Optional)"}
          </CardDescription>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xl">
                  Your Name
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="text-xl h-16"
                  />
                  <VoiceButton onText={(text) => handleVoiceInput(text, "name")} language={language} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-xl">
                  Shop Name
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="shopName"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="My Grocery Store"
                    className="text-xl h-16"
                  />
                  <VoiceButton onText={(text) => handleVoiceInput(text, "shopName")} language={language} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pinCode" className="text-xl">
                  PIN Code
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    placeholder="400001"
                    className="text-xl h-16"
                  />
                  <VoiceButton onText={(text) => handleVoiceInput(text, "pinCode")} language={language} />
                </div>
              </div>
              <Button
                onClick={useCurrentLocation}
                variant="outline"
                className="w-full h-12 text-lg flex items-center justify-center gap-2"
              >
                <MapPin className="h-5 w-5" />
                Use Current Location
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gstNumber" className="text-xl">
                  GST Number (Optional)
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="22AAAAA0000A1Z5"
                    className="text-xl h-16"
                  />
                  <VoiceButton onText={(text) => handleVoiceInput(text, "gstNumber")} language={language} />
                </div>
              </div>
              <Button variant="outline" className="w-full h-12 text-lg flex items-center justify-center gap-2">
                <Camera className="h-5 w-5" />
                Scan GST Certificate
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                <div className="flex items-start gap-2">
                  <FileText className="h-6 w-6 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">Platform Rates</h3>
                    <p className="mt-1">
                      Commission: <strong>2%</strong> + GST 18%
                    </p>
                    <p>
                      Delivery Charge: <strong>₹50</strong> + GST 18%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button onClick={handleBack} variant="outline" className="h-12 px-8 text-lg">
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="h-12 px-8 text-lg ml-auto bg-blue-500 hover:bg-blue-600"
              disabled={isNextDisabled()}
            >
              {step === 3 ? "Submit" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RetailerOnboarding() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 pb-16">
          <RetailerOnboardingForm />
        </main>
        <Footer />
      </div>
    </TranslationProvider>
  )
}
