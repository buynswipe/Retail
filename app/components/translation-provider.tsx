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

    // Voice Input
    "start.voice.input": "Start Voice Input",
    "stop.voice.input": "Stop Voice Input",
    "voice.input.not.supported": "Voice input not supported in this browser",
    "voice.input.error": "Error with voice input",
    "voice.input.listening": "Listening...",
    "voice.input.processing": "Processing...",

    // PIN Code Lookup
    "pinCode.detectLocation": "Detect location",
    "pinCode.success": "Location Detected",
    "pinCode.locationDetected": "Your location has been detected successfully.",
    "pinCode.partialSuccess": "Approximate Location",
    "pinCode.approximateLocation": "Using approximate location data.",
    "pinCode.error": "Location Error",
    "pinCode.locationError": "Could not detect your location. Please enter manually.",
    "pinCode.browserNotSupported": "Your browser does not support geolocation.",

    // Retailer Onboarding
    "onboarding.retailerOnboarding": "Retailer Onboarding",
    "onboarding.step1": "Step 1: Basic Information",
    "onboarding.step2": "Step 2: Location",
    "onboarding.step3": "Step 3: GST Information (Optional)",
    "onboarding.yourName": "Your Name",
    "onboarding.yourNamePlaceholder": "John Doe",
    "onboarding.shopName": "Shop Name",
    "onboarding.shopNamePlaceholder": "My Grocery Store",
    "onboarding.pinCode": "PIN Code",
    "onboarding.pinCodePlaceholder": "400001",
    "onboarding.useCurrentLocation": "Use Current Location",
    "onboarding.gstNumber": "GST Number (Optional)",
    "onboarding.gstNumberPlaceholder": "22AAAAA0000A1Z5",
    "onboarding.scanGstCertificate": "Scan GST Certificate",
    "onboarding.platformRates": "Platform Rates",
    "onboarding.commission": "Commission: ",
    "onboarding.deliveryCharge": "Delivery Charge: ",
    "onboarding.back": "Back",
    "onboarding.next": "Next",
    "onboarding.submit": "Submit",
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

    // Voice Input
    "start.voice.input": "आवाज इनपुट शुरू करें",
    "stop.voice.input": "आवाज इनपुट बंद करें",
    "voice.input.not.supported": "इस ब्राउज़र में आवाज इनपुट समर्थित नहीं है",
    "voice.input.error": "आवाज इनपुट में त्रुटि",
    "voice.input.listening": "सुन रहा है...",
    "voice.input.processing": "प्रोसेसिंग...",

    // PIN Code Lookup
    "pinCode.detectLocation": "स्थान का पता लगाएं",
    "pinCode.success": "स्थान का पता चला",
    "pinCode.locationDetected": "आपके स्थान का पता सफलतापूर्वक लगा लिया गया है।",
    "pinCode.partialSuccess": "अनुमानित स्थान",
    "pinCode.approximateLocation": "अनुमानित स्थान डेटा का उपयोग कर रहे हैं।",
    "pinCode.error": "स्थान त्रुटि",
    "pinCode.locationError": "आपके स्थान का पता नहीं लगा सका। कृपया मैन्युअल रूप से दर्ज करें।",
    "pinCode.browserNotSupported": "आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता है।",

    // Retailer Onboarding
    "onboarding.retailerOnboarding": "रिटेलर ऑनबोर्डिंग",
    "onboarding.step1": "चरण 1: बुनियादी जानकारी",
    "onboarding.step2": "चरण 2: स्थान",
    "onboarding.step3": "चरण 3: GST जानकारी (वैकल्पिक)",
    "onboarding.yourName": "आपका नाम",
    "onboarding.yourNamePlaceholder": "जॉन डो",
    "onboarding.shopName": "दुकान का नाम",
    "onboarding.shopNamePlaceholder": "मेरी किराना दुकान",
    "onboarding.pinCode": "पिन कोड",
    "onboarding.pinCodePlaceholder": "400001",
    "onboarding.useCurrentLocation": "वर्तमान स्थान का उपयोग करें",
    "onboarding.gstNumber": "GST नंबर (वैकल्पिक)",
    "onboarding.gstNumberPlaceholder": "22AAAAA0000A1Z5",
    "onboarding.scanGstCertificate": "GST प्रमाणपत्र स्कैन करें",
    "onboarding.platformRates": "प्लेटफॉर्म दरें",
    "onboarding.commission": "कमीशन: ",
    "onboarding.deliveryCharge": "डिलीवरी शुल्क: ",
    "onboarding.back": "पीछे",
    "onboarding.next": "अगला",
    "onboarding.submit": "जमा करें",
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
