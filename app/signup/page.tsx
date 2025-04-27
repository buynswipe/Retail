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
import { signUp, sendOtp, verifyOtp } from "@/lib/auth-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function SignupForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"retailer" | "wholesaler" | "delivery" | null>(null)
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone")
  const router = useRouter()

  const handleVoiceInput = (text: string) => {
    // Clean up voice input based on auth method
    if (authMethod === "phone") {
      const digits = text.replace(/\D/g, "")
      if (step === 1) {
        setIdentifier(digits)
      } else if (step === 2) {
        setOtp(digits)
      }
    } else {
      // For email, just use the text as is
      if (step === 1) {
        setIdentifier(text.toLowerCase())
      } else if (step === 2) {
        setOtp(text)
      }
    }
  }

  const validateIdentifier = () => {
    if (authMethod === "phone") {
      return identifier.length === 10
    } else {
      // Simple email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    }
  }

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Make sure phone number doesn't already have country code
      const cleanIdentifier = authMethod === "phone" ? identifier.replace(/^\+91/, "") : identifier

      const result = await sendOtp(cleanIdentifier)

      if (result.success) {
        setStep(2)
        toast({
          title: "OTP Sent",
          description: `A verification code has been sent to your ${authMethod}.`,
        })
      } else {
        setError(result.error || `Failed to send OTP to your ${authMethod}. Please try again.`)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error sending OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Make sure phone number doesn't already have country code
      const cleanIdentifier = authMethod === "phone" ? identifier.replace(/^\+91/, "") : identifier

      const result = await verifyOtp(cleanIdentifier, otp)

      if (result.success) {
        setStep(3)
      } else {
        setError(result.error || "Failed to verify OTP. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error verifying OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const continueToOnboarding = async () => {
    if (role) {
      try {
        setIsLoading(true)
        // Register the user with basic info
        const result = await signUp({
          phone: authMethod === "phone" ? identifier : undefined,
          email: authMethod === "email" ? identifier : undefined,
          role: role,
        })

        if (result.success) {
          // Redirect to specific onboarding flow based on role
          router.push(`/onboarding/${role}`)
        } else {
          setError(result.error || "Failed to create account. Please try again.")
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.")
        console.error("Error creating account:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">{t("signup.title")}</CardTitle>
          <CardDescription className="text-xl text-center">
            {step === 1 && "Enter your phone number or email to get started"}
            {step === 2 && `Enter the OTP sent to your ${authMethod}`}
            {step === 3 && "Select your role in the supply chain"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          {step === 1 && (
            <>
              <Tabs
                defaultValue="phone"
                onValueChange={(value) => {
                  setAuthMethod(value as "phone" | "email")
                  setIdentifier("") // Clear identifier when switching tabs
                  setError("")
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="phone">Phone</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>
                <TabsContent value="phone" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xl">
                      {t("phone")}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="phone"
                        type="tel"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="text-xl h-16"
                      />
                      <VoiceButton onText={handleVoiceInput} language={language} />
                    </div>
                    <p className="text-sm text-gray-500">Enter 10 digits without country code</p>
                  </div>
                </TabsContent>
                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xl">
                      Email
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="email"
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="you@example.com"
                        className="text-xl h-16"
                      />
                      <VoiceButton onText={handleVoiceInput} language={language} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleSendOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={!validateIdentifier() || isLoading}
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
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="text-xl h-16"
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
                <Button variant="link" onClick={() => setStep(1)} className="mt-2">
                  Change {authMethod}
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
