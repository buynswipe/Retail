"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GB, IN } from "country-flag-icons/react/3x2"

export default function LanguageToggle() {
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const router = useRouter()

  useEffect(() => {
    // Get language preference from localStorage if available
    const savedLanguage = localStorage.getItem("language") as "en" | "hi"
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "hi" : "en"
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)

    // Trigger re-render of the page with the new language
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="p-0 h-12 w-12"
      aria-label={language === "en" ? "Switch to Hindi" : "Switch to English"}
    >
      {language === "en" ? <IN className="h-8 w-8" /> : <GB className="h-8 w-8" />}
    </Button>
  )
}
