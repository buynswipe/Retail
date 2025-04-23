"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

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
    "demo.accounts": "Demo Accounts",
    "enter.otp": "Enter the OTP sent to your WhatsApp",
    "enter.phone": "Enter your phone number to log in",
    "select.role": "Select your role in the supply chain",

    // Navigation
    "nav.home": "Home",
    "nav.orders": "Orders",
    "nav.products": "Products",
    "nav.chat": "Chat",
    "nav.profile": "Profile",
    "nav.payments": "Payments",
    "nav.tax": "Tax",
    "nav.notifications": "Notifications",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome",
    "dashboard.recent.orders": "Recent Orders",
    "dashboard.find.wholesalers": "Find Wholesalers",
    "dashboard.pending.orders": "Pending Orders",
    "dashboard.monthly.sales": "Monthly Sales",
    "dashboard.find.assignments": "Find Assignments",
    "dashboard.active.deliveries": "Active Deliveries",
    "dashboard.earnings": "Earnings",

    // Orders
    "orders.title": "Orders",
    "orders.status.placed": "Placed",
    "orders.status.confirmed": "Confirmed",
    "orders.status.rejected": "Rejected",
    "orders.status.dispatched": "Dispatched",
    "orders.status.delivered": "Delivered",
    "orders.filter": "Filter Orders",
    "orders.search": "Search Orders",
    "orders.details": "Order Details",
    "orders.items": "Order Items",
    "orders.total": "Total",
    "orders.date": "Order Date",
    "orders.status": "Status",

    // Products
    "products.title": "Products",
    "products.search": "Search Products",
    "products.filter": "Filter Products",
    "products.add": "Add Product",
    "products.edit": "Edit Product",
    "products.price": "Price",
    "products.stock": "Stock",
    "products.category": "Category",

    // Payments
    "payments.title": "Payments",
    "payments.history": "Payment History",
    "payments.method": "Payment Method",
    "payments.status": "Payment Status",
    "payments.amount": "Amount",
    "payments.date": "Payment Date",
    "payments.details": "Payment Details",

    // Profile
    "profile.title": "Profile",
    "profile.edit": "Edit Profile",
    "profile.business": "Business Details",
    "profile.personal": "Personal Details",
    "profile.settings": "Settings",
    "profile.logout": "Logout",
    "profile.language": "Language",
    "profile.notifications": "Notifications",
    "profile.help": "Help & Support",

    // Misc
    loading: "Loading...",
    error: "Error",
    success: "Success",
    retry: "Retry",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    back: "Back",
    next: "Next",
    done: "Done",
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
    "demo.accounts": "डेमो अकाउंट",
    "enter.otp": "आपके WhatsApp पर भेजा गया OTP दर्ज करें",
    "enter.phone": "लॉग इन करने के लिए अपना फोन नंबर दर्ज करें",
    "select.role": "सप्लाई चेन में अपनी भूमिका चुनें",

    // Navigation
    "nav.home": "होम",
    "nav.orders": "ऑर्डर",
    "nav.products": "प्रोडक्ट्स",
    "nav.chat": "चैट",
    "nav.profile": "प्रोफाइल",
    "nav.payments": "पेमेंट्स",
    "nav.tax": "टैक्स",
    "nav.notifications": "नोटिफिकेशन",

    // Dashboard
    "dashboard.title": "डैशबोर्ड",
    "dashboard.welcome": "स्वागत है",
    "dashboard.recent.orders": "हाल के ऑर्डर",
    "dashboard.find.wholesalers": "थोक विक्रेता खोजें",
    "dashboard.pending.orders": "अपूर्ण ऑर्डर",
    "dashboard.monthly.sales": "मासिक बिक्री",
    "dashboard.find.assignments": "असाइनमेंट खोजें",
    "dashboard.active.deliveries": "सक्रिय डिलीवरी",
    "dashboard.earnings": "कमाई",

    // Orders
    "orders.title": "ऑर्डर",
    "orders.status.placed": "प्लेस्ड",
    "orders.status.confirmed": "कन्फर्म्ड",
    "orders.status.rejected": "रिजेक्टेड",
    "orders.status.dispatched": "डिस्पैच्ड",
    "orders.status.delivered": "डिलीवर्ड",
    "orders.filter": "ऑर्डर फ़िल्टर करें",
    "orders.search": "ऑर्डर खोजें",
    "orders.details": "ऑर्डर विवरण",
    "orders.items": "ऑर्डर आइटम",
    "orders.total": "कुल",
    "orders.date": "ऑर्डर तिथि",
    "orders.status": "स्थिति",

    // Products
    "products.title": "प्रोडक्ट्स",
    "products.search": "प्रोडक्ट्स खोजें",
    "products.filter": "प्रोडक्ट्स फ़िल्टर करें",
    "products.add": "प्रोडक्ट जोड़ें",
    "products.edit": "प्रोडक्ट एडिट करें",
    "products.price": "कीमत",
    "products.stock": "स्टॉक",
    "products.category": "श्रेणी",

    // Payments
    "payments.title": "पेमेंट्स",
    "payments.history": "पेमेंट इतिहास",
    "payments.method": "पेमेंट विधि",
    "payments.status": "पेमेंट स्थिति",
    "payments.amount": "राशि",
    "payments.date": "पेमेंट तिथि",
    "payments.details": "पेमेंट विवरण",

    // Profile
    "profile.title": "प्रोफाइल",
    "profile.edit": "प्रोफाइल एडिट करें",
    "profile.business": "व्यापार विवरण",
    "profile.personal": "व्यक्तिगत विवरण",
    "profile.settings": "सेटिंग्स",
    "profile.logout": "लॉगआउट",
    "profile.language": "भाषा",
    "profile.notifications": "नोटिफिकेशन",
    "profile.help": "सहायता और समर्थन",

    // Misc
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    retry: "पुनः प्रयास करें",
    cancel: "रद्द करें",
    save: "सेव करें",
    delete: "डिलीट करें",
    edit: "एडिट करें",
    add: "जोड़ें",
    search: "खोजें",
    filter: "फ़िल्टर",
    sort: "क्रमबद्ध करें",
    back: "वापस",
    next: "अगला",
    done: "पूर्ण",
  },
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Get language preference from AsyncStorage if available
    const loadLanguage = async () => {
      try {
        const savedLanguage = (await AsyncStorage.getItem("language")) as Language
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi")) {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("Error loading language preference:", error)
      }
    }

    loadLanguage()
  }, [])

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    AsyncStorage.setItem("language", lang).catch((error) => {
      console.error("Error saving language preference:", error)
    })
  }

  return (
    <TranslationContext.Provider value={{ language, t, setLanguage: changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
