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
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-service"
import type { UserRole } from "@/lib/supabase-client"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function SignupForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleVoiceInput = (text: string) => {
    // Clean up voice input to get only digits
    const digits = text.replace(/\D/g, "")
    if (step === 1) {
      setPhoneNumber(digits)
    } else if (step === 2) {
      setOtp(digits)
    }
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for Indian phone numbers (10 digits)
    return /^[6-9]\d{9}$/.test(phone)
  }

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Validate phone number format
      if (!validatePhoneNumber(phoneNumber)) {
        setError("Please enter a valid 10-digit phone number")
        setIsLoading(false)
        return
      }

      // For signup, we don't need to check if user exists
      // In a real app, this would call an API to send OTP
      setStep(2)
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your WhatsApp.",
      })
    } catch (error) {
      console.error("Error sending OTP:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        setError("Invalid OTP. Please enter a 6-digit code.")
        setIsLoading(false)
        return
      }

      // In a real app, this would verify the OTP with an API
      // For demo purposes, we'll just proceed to the next step
      setStep(3)
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const continueToOnboarding = async () => {
    if (!role) {
      setError("Please select a role to continue")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Register the user with basic info
      const result = await signUp({
        phone: phoneNumber,
        role: role,
      })

      if (result.success) {
        // Redirect to specific onboarding flow based on role
        router.push(`/onboarding/${role}`)
      } else {
        setError(result.error || "Failed to create account. Please try again.")
      }
    } catch (error) {
      console.error("Error creating account:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
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
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

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
                    maxLength={10}
                    aria-invalid={error ? "true" : "false"}
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                </div>
              </div>
              <Button
                onClick={handleSendOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={phoneNumber.length !== 10 || isLoading}
              >
                {isLoading ? "Sending..." : t("send.otp")}
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
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-xl h-16"
                    maxLength={6}
                    aria-invalid={error ? "true" : "false"}
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                </div>
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : t("verify")}
              </Button>

              <div className="text-center mt-4">
                <p className="text-lg">Enter any 6 digits as OTP for demo</p>
                <Button variant="link" onClick={handleSendOtp} disabled={isLoading} className="mt-2">
                  Resend OTP
                </Button>
              </div>
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
                disabled={!role || isLoading}
              >
                {isLoading ? "Processing..." : t("continue")}
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
      <Toaster />
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
