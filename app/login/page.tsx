"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import VoiceButton from "../components/voice-button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { sendOtp, verifyOtp } from "@/lib/auth-service"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isDemoAccount } from "@/lib/demo-auth"

function LoginForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || ""
  const { login } = useAuth()

  const handleVoiceInput = (text: string) => {
    // Clean up voice input to get only digits if phone auth
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
      // Ensure phone number is 10 digits (without country code)
      return /^\d{10}$/.test(identifier)
    } else {
      // Simple email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    }
  }

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // For phone, ensure we're passing just the 10 digits
      const cleanIdentifier = authMethod === "phone" ? identifier.replace(/\D/g, "").slice(-10) : identifier

      console.log("Sending OTP to:", cleanIdentifier)

      const result = await sendOtp(cleanIdentifier)

      if (result.success) {
        setStep(2)

        // Special message for demo accounts
        if (isDemoAccount(cleanIdentifier)) {
          toast({
            title: "Demo Account",
            description: "Enter any 6 digits as OTP for demo accounts",
          })
        } else {
          toast({
            title: "OTP Sent",
            description: `A verification code has been sent to your ${authMethod}.`,
          })
        }
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
      // For phone, ensure we're passing just the 10 digits
      const cleanIdentifier = authMethod === "phone" ? identifier.replace(/\D/g, "").slice(-10) : identifier

      const result = await verifyOtp(cleanIdentifier, otp)

      if (result.success && result.userData) {
        // Use the login function from auth context
        if (typeof login === "function") {
          login(result.userData)
        } else {
          console.error("Login function is not available")
          setError("Authentication error. Please try again.")
          setIsLoading(false)
          return
        }

        // Redirect based on role or to the redirectTo URL
        if (redirectTo) {
          router.push(redirectTo)
        } else if (result.userData.role === "admin") {
          router.push("/admin/dashboard")
        } else if (result.userData.role === "retailer") {
          router.push("/retailer/dashboard")
        } else if (result.userData.role === "wholesaler") {
          router.push("/wholesaler/dashboard")
        } else if (result.userData.role === "delivery") {
          router.push("/delivery/dashboard")
        } else {
          router.push("/")
        }

        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        })
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

  // Function to fill in demo account credentials
  const fillDemoAccount = (type: "admin" | "retailer" | "wholesaler" | "delivery") => {
    if (authMethod === "phone") {
      switch (type) {
        case "admin":
          setIdentifier("1234567890")
          break
        case "retailer":
          setIdentifier("9876543210")
          break
        case "wholesaler":
          setIdentifier("9876543211")
          break
        case "delivery":
          setIdentifier("9876543212")
          break
      }
    } else {
      switch (type) {
        case "admin":
          setIdentifier("admin@retailbandhu.com")
          break
        case "retailer":
          setIdentifier("retailer@retailbandhu.com")
          break
        case "wholesaler":
          setIdentifier("wholesaler@retailbandhu.com")
          break
        case "delivery":
          setIdentifier("delivery@retailbandhu.com")
          break
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">{t("login.title")}</CardTitle>
          <CardDescription className="text-xl text-center">
            {step === 1 && "Enter your phone number or email to log in"}
            {step === 2 && `Enter the OTP sent to your ${authMethod}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

              <div className="text-center mt-4">
                <p className="text-lg mb-2">Demo Accounts:</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" onClick={() => fillDemoAccount("admin")} className="text-sm">
                    Admin: {authMethod === "phone" ? "1234567890" : "admin@..."}
                  </Button>
                  <Button variant="outline" onClick={() => fillDemoAccount("retailer")} className="text-sm">
                    Retailer: {authMethod === "phone" ? "9876543210" : "retailer@..."}
                  </Button>
                  <Button variant="outline" onClick={() => fillDemoAccount("wholesaler")} className="text-sm">
                    Wholesaler: {authMethod === "phone" ? "9876543211" : "wholesaler@..."}
                  </Button>
                  <Button variant="outline" onClick={() => fillDemoAccount("delivery")} className="text-sm">
                    Delivery: {authMethod === "phone" ? "9876543212" : "delivery@..."}
                  </Button>
                </div>
              </div>
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

          <div className="text-center mt-6">
            <p className="text-lg">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

export default function LoginPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 pb-16">
          <LoginForm />
        </main>
        <Footer />
      </div>
    </TranslationProvider>
  )
}
