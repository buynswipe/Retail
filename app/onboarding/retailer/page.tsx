"use client"

import { RetailerOnboardingForm } from "@/app/components/retailer-onboarding-form"
import { TranslationProvider } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RetailerOnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not logged in and not loading, redirect to login
    if (!loading && !user) {
      router.push("/login?redirect=/onboarding/retailer")
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <RetailerOnboardingForm />
        </main>
      </div>
    </TranslationProvider>
  )
}
