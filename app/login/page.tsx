"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Mic } from "lucide-react"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Create a separate LoginForm component that uses the translation hook
function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()
  const { t, language } = useTranslation()

  // Voice input functionality
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")

  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setIsListening(true)

      // Use browser's speech recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = language === "hi" ? "hi-IN" : "en-US"
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)

        // Extract numbers from speech
        const numericInput = transcript.replace(/\D/g, "")
        if (numericInput) {
          setPhoneNumber(numericInput)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      })
    }
  }

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)

    try {
      // In a real app, we would send an OTP to the phone number
      // For demo purposes, we'll just set otpSent to true
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setOtpSent(true)
      setError("")
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your WhatsApp.",
      })
    } catch (error) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)

    try {
      // For demo purposes, any 6-digit OTP is valid
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      // Get user role based on phone number
      let role = "retailer" // Default role
      if (phoneNumber === "1234567890") role = "admin"
      else if (phoneNumber === "9876543211") role = "wholesaler"
      else if (phoneNumber === "9876543212") role = "delivery"

      const userData = {
        id: `user-${Date.now()}`,
        phone_number: phoneNumber,
        role: role,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        business_name: role === "retailer" ? "Demo Shop" : "Demo Business",
        created_at: new Date().toISOString(),
      }

      // Store user data
      localStorage.setItem("currentUser", JSON.stringify(userData))
      setUser(userData)

      // Redirect based on role
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else if (role === "retailer") {
        router.push("/retailer/dashboard")
      } else if (role === "wholesaler") {
        router.push("/wholesaler/dashboard")
      } else if (role === "delivery") {
        router.push("/delivery/dashboard")
      }

      toast({
        title: "Login Successful",
        description: "You have been logged in successfully.",
      })
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoPhone: string) => {
    setPhoneNumber(demoPhone)
    setOtp("123456") // Set a default OTP for demo accounts
    setOtpSent(true)

    // Wait a bit then trigger login
    setTimeout(() => {
      handleLogin()
    }, 500)
  }

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 p-4 py-24">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
          <CardDescription>
            {!otpSent ? t("Enter your phone number to log in") : t("Enter the OTP sent to your WhatsApp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t("Error")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone")}
                </label>
                <div className="flex">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" className="ml-2" onClick={startListening}>
                    <Mic className={isListening ? "text-red-500" : ""} />
                    <span className="sr-only">{t("Use voice input")}</span>
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={handleSendOtp} disabled={isLoading || phoneNumber.length !== 10}>
                {isLoading ? t("Sending...") : t("send.otp")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("otp")}
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={isLoading || otp.length !== 6}>
                {isLoading ? t("Verifying...") : t("verify")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setOtpSent(false)} disabled={isLoading}>
                {t("Change Phone Number")}
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-center font-medium">{t("Demo Accounts")}</h3>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("1234567890")}
                disabled={isLoading}
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Admin")}</span>
                  <span className="text-sm text-gray-500">1234567890</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("9876543210")}
                disabled={isLoading}
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Retailer")}</span>
                  <span className="text-sm text-gray-500">9876543210</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("9876543211")}
                disabled={isLoading}
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Wholesaler")}</span>
                  <span className="text-sm text-gray-500">9876543211</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("9876543212")}
                disabled={isLoading}
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Delivery")}</span>
                  <span className="text-sm text-gray-500">9876543212</span>
                </div>
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              {t("Click any demo account to log in instantly with test data")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            {t("Don't have an account?")}{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              {t("signup.title")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

// Main page component that wraps the LoginForm with TranslationProvider
export default function LoginPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <LoginForm />
        <Footer />
        <Toaster />
      </div>
    </TranslationProvider>
  )
}
