"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { Store, Warehouse, Truck } from "lucide-react"
import VoiceButton from "../components/voice-button"
import Link from "next/link"

function SignupForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"retailer" | "wholesaler" | "delivery" | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")

  const handleVoiceInput = (text: string) => {
    // Clean up voice input to get only digits
    const digits = text.replace(/\D/g, "")
    if (step === 1) {
      setPhoneNumber(digits)
    } else if (step === 2) {
      setOtp(digits)
    }
  }

  const sendOtp = async () => {
    // In a real app, this would send an OTP via WhatsApp Business API
    // For this demo, just advance to next step
    setStep(2)
  }

  const verifyOtp = async () => {
    // In a real app, this would verify the OTP
    // For this demo, just advance to role selection
    setStep(3)
  }

  const continueToOnboarding = () => {
    if (role) {
      // Redirect to specific onboarding flow based on role
      window.location.href = `/onboarding/${role}`
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">{t("signup.title")}</CardTitle>
          <CardDescription className="text-xl text-center">
            {step === 1 && "Enter your phone number to get started"}
            {step === 2 && "Enter the OTP sent to your WhatsApp"}
            {step === 3 && "Select your role in the supply chain"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xl">
                  {t("phone")}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="text-xl h-16"
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                </div>
              </div>
              <Button
                onClick={sendOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={phoneNumber.length !== 10}
              >
                {t("send.otp")}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-xl">
                  {t("otp")}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="text-xl h-16"
                    maxLength={6}
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                </div>
              </div>
              <Button
                onClick={verifyOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={otp.length !== 6}
              >
                {t("verify")}
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <RadioGroup
                value={role || ""}
                onValueChange={(value) => setRole(value as "retailer" | "wholesaler" | "delivery")}
                className="grid grid-cols-1 gap-6"
              >
                <Label
                  htmlFor="retailer"
                  className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer ${
                    role === "retailer" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="retailer" id="retailer" className="sr-only" />
                  <Store className="h-12 w-12 text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-xl font-medium">{t("benefits.retailer.title")}</p>
                    <p className="text-gray-500">{t("benefits.retailer.description")}</p>
                  </div>
                </Label>

                <Label
                  htmlFor="wholesaler"
                  className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer ${
                    role === "wholesaler" ? "border-orange-500 bg-orange-50" : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="wholesaler" id="wholesaler" className="sr-only" />
                  <Warehouse className="h-12 w-12 text-orange-500" />
                  <div className="space-y-1">
                    <p className="text-xl font-medium">{t("benefits.wholesaler.title")}</p>
                    <p className="text-gray-500">{t("benefits.wholesaler.description")}</p>
                  </div>
                </Label>

                <Label
                  htmlFor="delivery"
                  className={`flex items-center space-x-4 border rounded-lg p-4 cursor-pointer ${
                    role === "delivery" ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                  <Truck className="h-12 w-12 text-green-500" />
                  <div className="space-y-1">
                    <p className="text-xl font-medium">{t("benefits.delivery.title")}</p>
                    <p className="text-gray-500">{t("benefits.delivery.description")}</p>
                  </div>
                </Label>
              </RadioGroup>

              <Button
                onClick={continueToOnboarding}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={!role}
              >
                {t("continue")}
              </Button>
            </>
          )}

          <div className="text-center mt-6">
            <p className="text-lg">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-500 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 pb-16">
          <SignupForm />
        </main>
        <Footer />
      </div>
    </TranslationProvider>
  )
}
