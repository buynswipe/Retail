"use client"

import { useState, useEffect } from "react"
import type { Variant } from "@/lib/ab-testing"

interface UseABTestProps {
  testId: string
  variants: Variant[]
  defaultVariant: Variant
}

export function useABTest({ testId, variants, defaultVariant }: UseABTestProps) {
  const [variant, setVariant] = useState<Variant>(defaultVariant)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get variant from cookie
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
      return match ? match[2] : null
    }

    const variantFromCookie = getCookieValue(`ab_test_${testId}`) as Variant | null

    if (variantFromCookie && variants.includes(variantFromCookie)) {
      setVariant(variantFromCookie)
    } else {
      // Assign random variant
      const newVariant = variants[Math.floor(Math.random() * variants.length)]
      setVariant(newVariant)

      // Store in cookie (30 days expiry)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      document.cookie = `ab_test_${testId}=${newVariant};expires=${expiryDate.toUTCString()};path=/;samesite=lax`
    }

    setIsLoaded(true)

    // Track exposure
    const trackExposure = async () => {
      try {
        const { trackTestExposure } = await import("@/lib/ab-testing")
        const userId = localStorage.getItem("userId")
        await trackTestExposure(testId, variant, userId)
      } catch (error) {
        console.error("Error tracking test exposure:", error)
      }
    }

    trackExposure()
  }, [testId, variants, defaultVariant])

  // Function to track conversion
  const trackConversion = async (conversionType: string, value = 1) => {
    try {
      const { trackTestConversion } = await import("@/lib/ab-testing")
      const userId = localStorage.getItem("userId")
      await trackTestConversion(testId, variant, userId, conversionType, value)
    } catch (error) {
      console.error("Error tracking conversion:", error)
    }
  }

  return { variant, isLoaded, trackConversion }
}
