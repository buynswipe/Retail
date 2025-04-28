"use client"

import { useState, useEffect } from "react"
import { useTranslation as useI18nTranslation } from "@/app/components/translation-provider"

// This hook safely handles translations in both client and server environments
export function useSafeTranslation() {
  const [isMounted, setIsMounted] = useState(false)
  const { t: i18nT, i18n, ready } = useI18nTranslation()

  // Default translation function that returns the key during SSR
  const defaultT = (key: string) => key

  // Use an object to store the translation function and any other properties
  const [translation, setTranslation] = useState({
    t: defaultT,
    i18n: null,
    ready: false,
  })

  useEffect(() => {
    setIsMounted(true)
    try {
      // Only try to use the real translation hook on the client
      setTranslation({ t: i18nT, i18n, ready })
    } catch (error) {
      console.error("Translation provider not available:", error)
      // Keep using the default translation function
    }
  }, [i18nT, i18n, ready])

  return {
    t: translation.t,
    i18n: translation.i18n,
    ready: translation.ready,
    isMounted,
  }
}
