"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"

type Language = "en" | "hi"

interface TranslationContextType {
  language: Language
  t: (key: string) => string
  setLanguage: (lang: Language) => void
}

const translations = {
  en: {
    // Landing page
    "hero.headline": "Power Your FMCG Business",
    "hero.subheadline": "Seamless ordering and delivery for retailers, wholesalers, and delivery partners",
    "cta.join": "Join Now",
    "cta.download": "Download App",
    "benefits.retailer.title": "Retailers",
    "benefits.retailer.description": "Order, track, save time",
    "benefits.wholesaler.title": "Wholesalers",
    "benefits.wholesaler.description": "Grow sales, easy payments",
    "benefits.delivery.title": "Delivery Partners",
    "benefits.delivery.description": "Earn per delivery",
    "how.title": "How It Works",
    "how.step1": "Join",
    "how.step2": "Order",
    "how.step3": "Deliver",
    "how.step4": "Track",
    "learn.more": "Learn More",

    // Auth
    "login.title": "Log In",
    "signup.title": "Sign Up",
    phone: "Phone Number",
    otp: "OTP",
    "send.otp": "Send OTP",
    verify: "Verify",
    continue: "Continue",

    // Navigation
    "nav.home": "Home",
    "nav.orders": "Orders",
    "nav.chat": "Chat",
    "nav.tax": "Tax",

    // Footer
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact Us",
  },
  hi: {
    // Landing page
    "hero.headline": "अपने FMCG व्यवसाय को सशक्त करें",
    "hero.subheadline": "रिटेलर, थोक विक्रेता, और डिलीवरी पार्टनर के लिए आसान ऑर्डरिंग और डिलीवरी",
    "cta.join": "अभी जुड़ें",
    "cta.download": "ऐप डाउनलोड करें",
    "benefits.retailer.title": "रिटेलर्स",
    "benefits.retailer.description": "ऑर्डर करें, ट्रैक करें, समय बचाएं",
    "benefits.wholesaler.title": "थोक विक्रेता",
    "benefits.wholesaler.description": "बिक्री बढ़ाएं, आसान भुगतान",
    "benefits.delivery.title": "डिलीवरी पार्टनर",
    "benefits.delivery.description": "प्रति डिलीवरी कमाई",
    "how.title": "यह कैसे काम करता है",
    "how.step1": "जुड़ें",
    "how.step2": "ऑर्डर करें",
    "how.step3": "डिलीवर करें",
    "how.step4": "ट्रैक करें",
    "learn.more": "और जानें",

    // Auth
    "login.title": "लॉग इन",
    "signup.title": "साइन अप",
    phone: "फोन नंबर",
    otp: "ओटीपी",
    "send.otp": "ओटीपी भेजें",
    verify: "सत्यापित करें",
    continue: "जारी रखें",

    // Navigation
    "nav.home": "होम",
    "nav.orders": "ऑर्डर",
    "nav.chat": "चैट",
    "nav.tax": "टैक्स",

    // Footer
    "footer.privacy": "गोपनीयता नीति",
    "footer.terms": "सेवा की शर्तें",
    "footer.contact": "संपर्क करें",
  },
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Get language preference from localStorage if available
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  return (
    <TranslationContext.Provider value={{ language, t, setLanguage: changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
