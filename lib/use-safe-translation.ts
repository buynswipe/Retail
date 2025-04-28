"use client"

import { useTranslation as useNextTranslation } from "@/app/components/translation-provider"
import { useEffect, useState } from "react"

export function useTranslation() {
  const [translation, setTranslation] = useState(() => {
    try {
      const { t, locale, setLocale } = useNextTranslation()
      return { t, locale, setLocale }
    } catch (error) {
      // Provide a fallback function that just returns the key
      return {
        t: (key: string) => key,
        locale: "en",
        setLocale: () => {},
      }
    }
  })

  useEffect(() => {
    try {
      const { t, locale, setLocale } = useNextTranslation()
      setTranslation({ t, locale, setLocale })
    } catch (error) {
      // Provide a fallback function that just returns the key
      setTranslation({
        t: (key: string) => key,
        locale: "en",
        setLocale: () => {},
      })
    }
  }, [])

  return translation
}
