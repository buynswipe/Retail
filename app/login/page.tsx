"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Mic, Mail, Phone } from "lucide-react"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isValidEmail, isValidPhoneNumber } from "@/lib/validation"

// Create a separate LoginForm component that uses the translation hook
function LoginForm() {
  const [loginIdentifier, setLoginIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone")
  const { setUser } = useAuth()
  const router = useRouter()

  // Extract callback URL from query parameters
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null)

  useEffect(() => {
    // Get callback URL from query parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      setCallbackUrl(urlParams.get("callbackUrl"))
    }
  }, [])

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
          setLoginIdentifier(numericInput)
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

  const validateLoginIdentifier = () => {
    if (loginMethod === "phone") {
      if (!isValidPhoneNumber(loginIdentifier)) {
        setError("Please enter a valid 10-digit phone number")
        return false
      }
    } else {
      if (!isValidEmail(loginIdentifier)) {
        setError("Please enter a valid email address")
        return false
      }
    }
    return true
  }

  const handleSendOtp = async () => {
    if (!validateLoginIdentifier()) {
      return
    }

    setIsLoading(true)

    try {
      // In a real app, we would send an OTP to the phone number or email
      // For demo purposes, we'll just set otpSent to true
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setOtpSent(true)
      setError("")
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to your ${loginMethod === "phone" ? "WhatsApp" : "email"}.`,
      })
    } catch (error) {
      setError(`Failed to send OTP. Please try again.`)
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

      // Get user role based on login identifier
      let role = "retailer" // Default role
      let phoneNumber = loginIdentifier
      let email = loginIdentifier

      // For demo accounts
      if (loginMethod === "phone") {
        if (loginIdentifier === "1234567890") role = "admin"
        else if (loginIdentifier === "9876543211") role = "wholesaler"
        else if (loginIdentifier === "9876543212") role = "delivery"
        email = `${loginIdentifier}@example.com`
      } else {
        // If login with email, extract role from email domain for demo
        if (loginIdentifier.includes("admin")) role = "admin"
        else if (loginIdentifier.includes("wholesaler")) role = "wholesaler"
        else if (loginIdentifier.includes("delivery")) role = "delivery"
        phoneNumber = "9876543210" // Default phone for email logins
      }

      const userData = {
        id: `user-${Date.now()}`,
        phone_number: phoneNumber,
        email: email,
        role: role,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        business_name: role === "retailer" ? "Demo Shop" : "Demo Business",
        created_at: new Date().toISOString(),
      }

      // Store user data
      localStorage.setItem("currentUser", JSON.stringify(userData))
      setUser(userData)

      // Set a cookie to maintain the session across page refreshes
      document.cookie = `userRole=${role}; path=/; max-age=86400;`

      // Get the callback URL from the query parameters or use the default dashboard path
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get("callbackUrl")

      // Redirect based on callback or role
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
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

  const handleDemoLogin = async (demoIdentifier: string, method: "phone" | "email" = "phone") => {
    setLoginIdentifier(demoIdentifier)
    setLoginMethod(method)
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
            {!otpSent
              ? t("Enter your phone number or email to log in")
              : t(`Enter the OTP sent to your ${loginMethod === "phone" ? "WhatsApp" : "email"}`)}
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
              <Tabs
                defaultValue="phone"
                value={loginMethod}
                onValueChange={(value) => setLoginMethod(value as "phone" | "email")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("Phone")}
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("Email")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="phone" className="mt-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("phone")}
                    </label>
                    <div className="flex">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" className="ml-2" onClick={startListening}>
                        <Mic className={isListening ? "text-red-500" : ""} />
                        <span className="sr-only">{t("Use voice input")}</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="email" className="mt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("email")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={
                  isLoading ||
                  (loginMethod === "phone" ? loginIdentifier.length !== 10 : !isValidEmail(loginIdentifier))
                }
              >
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
                {t("Change Login Method")}
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-center font-medium">{t("Demo Accounts")}</h3>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("1234567890", "phone")}
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
                onClick={() => handleDemoLogin("9876543210", "phone")}
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
                onClick={() => handleDemoLogin("9876543211", "phone")}
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
                onClick={() => handleDemoLogin("9876543212", "phone")}
                disabled={isLoading}
                className="justify-start h-auto py-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Delivery")}</span>
                  <span className="text-sm text-gray-500">9876543212</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDemoLogin("delivery@example.com", "email")}
                disabled={isLoading}
                className="justify-start h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("Delivery (Email)")}</span>
                  <span className="text-sm text-gray-500">delivery@example.com</span>
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
