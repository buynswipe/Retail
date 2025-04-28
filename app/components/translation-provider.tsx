"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the translation context
interface TranslationContextType {
  t: (key: string) => string
  changeLanguage: (lang: string) => void
  currentLanguage: string
}

const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key,
  changeLanguage: () => {},
  currentLanguage: "en",
})

// Simple translations
const translations: Record<string, Record<string, string>> = {
  en: {
    Welcome: "Welcome",
    Login: "Login",
    Signup: "Signup",
    Dashboard: "Dashboard",
    Orders: "Orders",
    Products: "Products",
    Payments: "Payments",
    Settings: "Settings",
    Logout: "Logout",
    "Payment Failed": "Payment Failed",
    "Try Again": "Try Again",
    "View Orders": "View Orders",
    "There was an issue processing your payment. Please try again.":
      "There was an issue processing your payment. Please try again.",
  },
  hi: {
    Welcome: "स्वागत है",
    Login: "लॉगिन",
    Signup: "साइन अप",
    Dashboard: "डैशबोर्ड",
    Orders: "आदेश",
    Products: "उत्पाद",
    Payments: "भुगतान",
    Settings: "सेटिंग्स",
    Logout: "लॉगआउट",
    "Payment Failed": "भुगतान विफल",
    "Try Again": "पुनः प्रयास करें",
    "View Orders": "आदेश देखें",
    "There was an issue processing your payment. Please try again.":
      "आपके भुगतान को संसाधित करने में एक समस्या थी। कृपया पुन: प्रयास करें।",
  },
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en"
    setCurrentLanguage(savedLanguage)
  }, [])

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string) => {
    return translations[currentLanguage]?.[key] || key
  }

  return (
    <TranslationContext.Provider value={{ t, changeLanguage, currentLanguage }}>{children}</TranslationContext.Provider>
  )
}

export const useTranslation = () => useContext(TranslationContext)
