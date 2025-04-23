"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the translation context type
interface TranslationContextType {
  t: (key: string) => string
  language: string
  setLanguage: (lang: string) => void
}

// Create the context with a default value
const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key,
  language: "en",
  setLanguage: () => {},
})

// Define the translations
const translations = {
  en: {
    "hero.badge": "FMCG Supply Chain Platform",
    "hero.headline": "Connecting Retailers, Wholesalers & Delivery Partners",
    "hero.subheadline": "Streamline your FMCG supply chain operations with our integrated platform",
    "hero.trusted": "Trusted by businesses across India",
    "hero.stats.sales": "Monthly Sales",
    "hero.stats.products": "Products",
    "cta.join": "Join Now",
    "cta.download": "Download App",
    "benefits.retailer.title": "Retailer",
    "benefits.retailer.description": "Find wholesalers, order products, and manage your inventory",
    "benefits.wholesaler.title": "Wholesaler",
    "benefits.wholesaler.description": "Expand your customer base and streamline order management",
    "benefits.delivery.title": "Delivery Partner",
    "benefits.delivery.description": "Find delivery assignments and earn money",
    "how.title": "How It Works",
    "how.retailer.title": "For Retailers",
    "how.retailer.step1": "Sign up and verify your business",
    "how.retailer.step2": "Browse products from nearby wholesalers",
    "how.retailer.step3": "Place orders and track deliveries",
    "how.wholesaler.title": "For Wholesalers",
    "how.wholesaler.step1": "Register your business and list products",
    "how.wholesaler.step2": "Receive and manage orders",
    "how.wholesaler.step3": "Prepare orders for delivery",
    "how.delivery.title": "For Delivery Partners",
    "how.delivery.step1": "Sign up as a delivery partner",
    "how.delivery.step2": "Find delivery assignments in your area",
    "how.delivery.step3": "Complete deliveries and earn money",
    "login.title": "Login to Your Account",
    "signup.title": "Create Your Account",
    phone: "Phone Number",
    otp: "Verification Code",
    "send.otp": "Send OTP",
    verify: "Verify",
    continue: "Continue",
    Dashboard: "Dashboard",
    "Browse Products": "Browse Products",
    "My Orders": "My Orders",
    Payments: "Payments",
    "Tax Reports": "Tax Reports",
    Chat: "Chat",
    "My Products": "My Products",
    Orders: "Orders",
    Users: "Users",
    Settings: "Settings",
    Home: "Home",
    Login: "Login",
    "Sign Up": "Sign Up",
    "search.placeholder": "Search for products...",
    "search.button": "Search",
    "search.filters": "Filters",
    "search.filters.description": "Refine your search results",
    "search.category": "Category",
    "search.category.all": "All Categories",
    "search.price": "Price Range",
    "search.inStock": "In Stock Only",
    "search.discount": "Discounted Items Only",
    "search.sortBy": "Sort By",
    "search.sortBy.relevance": "Relevance",
    "search.sortBy.priceLowHigh": "Price: Low to High",
    "search.sortBy.priceHighLow": "Price: High to Low",
    "search.sortBy.newest": "Newest First",
    "search.apply": "Apply Filters",
    "search.activeFilters": "Active Filters",
    "search.clearAll": "Clear All",
  },
  hi: {
    "hero.badge": "FMCG सप्लाई चेन प्लेटफॉर्म",
    "hero.headline": "रिटेलर्स, होलसेलर्स और डिलीवरी पार्टनर्स को जोड़ना",
    "hero.subheadline": "हमारे एकीकृत प्लेटफॉर्म के साथ अपने FMCG सप्लाई चेन को सुव्यवस्थित करें",
    "hero.trusted": "पूरे भारत के व्यवसायों द्वारा विश्वसनीय",
    "hero.stats.sales": "मासिक बिक्री",
    "hero.stats.products": "उत्पाद",
    "cta.join": "अभी जुड़ें",
    "cta.download": "ऐप डाउनलोड करें",
    "benefits.retailer.title": "रिटेलर",
    "benefits.retailer.description": "होलसेलर्स ढूंढें, प्रोडक्ट्स ऑर्डर करें, और अपना इन्वेंटरी मैनेज करें",
    "benefits.wholesaler.title": "होलसेलर",
    "benefits.wholesaler.description": "अपने ग्राहक आधार का विस्तार करें और ऑर्डर प्रबंधन को सुव्यवस्थित करें",
    "benefits.delivery.title": "डिलीवरी पार्टनर",
    "benefits.delivery.description": "डिलीवरी असाइनमेंट ढूंढें और पैसे कमाएं",
    "how.title": "यह कैसे काम करता है",
    "how.retailer.title": "रिटेलर्स के लिए",
    "how.retailer.step1": "साइन अप करें और अपने व्यवसाय को सत्यापित करें",
    "how.retailer.step2": "आस-पास के होलसेलर्स से प्रोडक्ट्स ब्राउज़ करें",
    "how.retailer.step3": "ऑर्डर प्लेस करें और डिलीवरी ट्रैक करें",
    "how.wholesaler.title": "होलसेलर्स के लिए",
    "how.wholesaler.step1": "अपने व्यवसाय को पंजीकृत करें और उत्पादों को सूचीबद्ध करें",
    "how.wholesaler.step2": "ऑर्डर प्राप्त करें और प्रबंधित करें",
    "how.wholesaler.step3": "डिलीवरी के लिए ऑर्डर तैयार करें",
    "how.delivery.title": "डिलीवरी पार्टनर्स के लिए",
    "how.delivery.step1": "डिलीवरी पार्टनर के रूप में साइन अप करें",
    "how.delivery.step2": "अपने क्षेत्र में डिलीवरी असाइनमेंट ढूंढें",
    "how.delivery.step3": "डिलीवरी पूरी करें और पैसे कमाएं",
    "login.title": "अपने अकाउंट में लॉगिन करें",
    "signup.title": "अपना अकाउंट बनाएं",
    phone: "फोन नंबर",
    otp: "वेरिफिकेशन कोड",
    "send.otp": "OTP भेजें",
    verify: "वेरिफाई करें",
    continue: "जारी रखें",
    Dashboard: "डैशबोर्ड",
    "Browse Products": "प्रोडक्ट्स ब्राउज़ करें",
    "My Orders": "मेरे ऑर्डर्स",
    Payments: "पेमेंट्स",
    "Tax Reports": "टैक्स रिपोर्ट्स",
    Chat: "चैट",
    "My Products": "मेरे प्रोडक्ट्स",
    Orders: "ऑर्डर्स",
    Users: "यूजर्स",
    Settings: "सेटिंग्स",
    Home: "होम",
    Login: "लॉगिन",
    "Sign Up": "साइन अप",
    "search.placeholder": "प्रोडक्ट्स खोजें...",
    "search.button": "खोजें",
    "search.filters": "फिल्टर्स",
    "search.filters.description": "अपने खोज परिणामों को परिष्कृत करें",
    "search.category": "श्रेणी",
    "search.category.all": "सभी श्रेणियां",
    "search.price": "मूल्य सीमा",
    "search.inStock": "केवल स्टॉक में",
    "search.discount": "केवल छूट वाले आइटम",
    "search.sortBy": "क्रमबद्ध करें",
    "search.sortBy.relevance": "प्रासंगिकता",
    "search.sortBy.priceLowHigh": "मूल्य: कम से अधिक",
    "search.sortBy.priceHighLow": "मूल्य: अधिक से कम",
    "search.sortBy.newest": "सबसे नया पहले",
    "search.apply": "फिल्टर लागू करें",
    "search.activeFilters": "सक्रिय फिल्टर",
    "search.clearAll": "सभी साफ करें",
  },
}

// Create the provider component
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  // Get the initial language from localStorage if available, otherwise default to English
  const [language, setLanguage] = useState("en")

  // Load the language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save the language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  // Translation function
  const t = (key: string): string => {
    // @ts-ignore
    return translations[language]?.[key] || key
  }

  return <TranslationContext.Provider value={{ t, language, setLanguage }}>{children}</TranslationContext.Provider>
}

// Custom hook to use the translation context
export function useTranslation() {
  return useContext(TranslationContext)
}
