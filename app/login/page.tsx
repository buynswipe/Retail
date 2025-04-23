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
import { useRouter } from "next/navigation"

function LoginForm() {
  const { t, language } = useTranslation()
  const [step, setStep] = useState(1)
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

  const sendOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // In a real app, this would send an OTP via WhatsApp Business API
      // For demo, let's simulate checking if the user exists

      // For demo login purposes
      if (phoneNumber === "1234567890") {
        // Demo admin user
        setStep(2)
      } else if (phoneNumber === "9876543210") {
        // Demo retailer user
        setStep(2)
      } else if (phoneNumber === "9876543211") {
        // Demo wholesaler user
        setStep(2)
      } else if (phoneNumber === "9876543212") {
        // Demo delivery partner user
        setStep(2)
      } else {
        setError("No account found with this phone number. Please sign up first.")
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.")
      console.error("Error sending OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      // In a real app, this would verify the OTP
      // For demo login purposes, use any 6-digit OTP

      if (otp.length === 6) {
        // Demo login based on phone number
        if (phoneNumber === "1234567890") {
          // Admin user
          router.push("/admin/dashboard")
        } else if (phoneNumber === "9876543210") {
          // Retailer user
          router.push("/retailer/dashboard")
        } else if (phoneNumber === "9876543211") {
          // Wholesaler user
          router.push("/wholesaler/dashboard")
        } else if (phoneNumber === "9876543212") {
          // Delivery partner user
          router.push("/delivery/dashboard")
        }
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.")
      console.error("Error verifying OTP:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">{t("login.title")}</CardTitle>
          <CardDescription className="text-xl text-center">
            {step === 1 && "Enter your phone number to log in"}
            {step === 2 && "Enter the OTP sent to your WhatsApp"}
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
                  />
                  <VoiceButton onText={handleVoiceInput} language={language} />
                </div>
              </div>
              <Button
                onClick={sendOtp}
                className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
                disabled={phoneNumber.length !== 10 || isLoading}
              >
                {isLoading ? "Sending..." : t("send.otp")}
              </Button>

              <div className="text-center mt-4">
                <p className="text-lg mb-2">Demo Accounts:</p>
                <p className="text-md">Admin: 1234567890</p>
                <p className="text-md">Retailer: 9876543210</p>
                <p className="text-md">Wholesaler: 9876543211</p>
                <p className="text-md">Delivery: 9876543212</p>
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
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : t("verify")}
              </Button>

              <div className="text-center mt-4">
                <p className="text-lg">Enter any 6 digits as OTP for demo</p>
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
