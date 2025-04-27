"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define available languages
export type Language = "en" | "hi"

// Define translation context type
interface TranslationContextType {
  t: (key: string) => string
  language: Language
  setLanguage: (lang: Language) => void
}

// Create context with default values
const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key,
  language: "en",
  setLanguage: () => {},
})

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    "login.title": "Login",
    "signup.title": "Sign Up",
    phone: "Phone Number",
    email: "Email",
    password: "Password",
    "send.otp": "Send OTP",
    otp: "Verification Code",
    verify: "Verify",
    login: "Login",
    "sign.up": "Sign Up",
    "sign.out": "Sign Out",
    home: "Home",
    dashboard: "Dashboard",
    browse: "Browse Products",
    orders: "Orders",
    products: "Products",
    assignments: "Assignments",
    "active.deliveries": "Active Deliveries",
    "delivery.history": "Delivery History",
    users: "Users",
    roles: "Roles",
    analytics: "Analytics",
    "system.status": "System Status",
    profile: "Profile",
    notifications: "Notifications",
    name: "Name",
    "business.name": "Business Name",
    "pin.code": "PIN Code",
    "gst.number": "GST Number",
    "vehicle.type": "Vehicle Type",
    "bank.details": "Bank Details",
    "account.number": "Account Number",
    "ifsc.code": "IFSC Code",
    save: "Save",
    cancel: "Cancel",
    "profile.updated": "Profile Updated",
    "error.occurred": "An error occurred",
    "try.again": "Please try again",
    "welcome.message": "Welcome to RetailBandhu",
    "hero.subtitle": "Connecting retailers, wholesalers, and delivery partners",
    "get.started": "Get Started",
    "learn.more": "Learn More",
    "benefits.title": "Benefits",
    "how.it.works.title": "How It Works",
    "footer.copyright": "© 2023 RetailBandhu. All rights reserved.",
  },
  hi: {
    "login.title": "लॉगिन",
    "signup.title": "साइन अप",
    phone: "फोन नंबर",
    email: "ईमेल",
    password: "पासवर्ड",
    "send.otp": "OTP भेजें",
    otp: "वेरिफिकेशन कोड",
    verify: "वेरिफाई करें",
    login: "लॉगिन",
    "sign.up": "साइन अप",
    "sign.out": "साइन आउट",
    home: "होम",
    dashboard: "डैशबोर्ड",
    browse: "प्रोडक्ट्स ब्राउज़ करें",
    orders: "ऑर्डर्स",
    products: "प्रोडक्ट्स",
    assignments: "असाइनमेंट्स",
    "active.deliveries": "एक्टिव डिलीवरी",
    "delivery.history": "डिलीवरी हिस्ट्री",
    users: "यूजर्स",
    roles: "रोल्स",
    analytics: "एनालिटिक्स",
    "system.status": "सिस्टम स्टेटस",
    profile: "प्रोफाइल",
    notifications: "नोटिफिकेशन्स",
    name: "नाम",
    "business.name": "बिजनेस नाम",
    "pin.code": "पिन कोड",
    "gst.number": "GST नंबर",
    "vehicle.type": "वाहन प्रकार",
    "bank.details": "बैंक विवरण",
    "account.number": "अकाउंट नंबर",
    "ifsc.code": "IFSC कोड",
    save: "सेव",
    cancel: "कैंसल",
    "profile.updated": "प्रोफाइल अपडेट हो गया",
    "error.occurred": "एक त्रुटि हुई",
    "try.again": "कृपया पुनः प्रयास करें",
    "welcome.message": "रिटेल बंधु में आपका स्वागत है",
    "hero.subtitle": "रिटेलर्स, होलसेलर्स और डिलीवरी पार्टनर्स को जोड़ना",
    "get.started": "शुरू करें",
    "learn.more": "और जानें",
    "benefits.title": "लाभ",
    "how.it.works.title": "यह कैसे काम करता है",
    "footer.copyright": "© 2023 रिटेल बंधु. सर्वाधिकार सुरक्षित।",
  },
}

// Translation Provider component
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // Get initial language from localStorage or default to English
  const [language, setLanguage] = useState<Language>("en")

  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <TranslationContext.Provider value={{ t, language, setLanguage }}>{children}</TranslationContext.Provider>
}

// Custom hook to use translations
export function useTranslation() {
  return useContext(TranslationContext)
}
