"use client"

import { useTranslation } from "./translation-provider"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase-client"

export default function HeroSection() {
  const { t, language } = useTranslation()
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subheadlineRef = useRef<HTMLParagraphElement>(null)

  // Track join button click for analytics
  const trackJoinClick = async () => {
    try {
      // Check if we're using the mock client
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await supabase.from("Landing_Analytics").insert({
          event: "join_click",
          language: language,
        })
      } else {
        console.log("Analytics event tracked (mock): join_click", language)
      }
    } catch (error) {
      console.error("Failed to track event:", error)
    }
  }

  // Track download button click for analytics
  const trackDownloadClick = async () => {
    try {
      // Check if we're using the mock client
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await supabase.from("Landing_Analytics").insert({
          event: "download_click",
          language: language,
        })
      } else {
        console.log("Analytics event tracked (mock): download_click", language)
      }
    } catch (error) {
      console.error("Failed to track event:", error)
    }
  }

  // Use browser TTS for voice narration
  useEffect(() => {
    if (headlineRef.current && subheadlineRef.current && "speechSynthesis" in window) {
      const headlines = [headlineRef.current.textContent, subheadlineRef.current.textContent].filter(Boolean).join(". ")

      if (headlines) {
        const utterance = new SpeechSynthesisUtterance(headlines)
        utterance.lang = language === "en" ? "en-IN" : "hi-IN"
        utterance.rate = 0.9

        // Only play voice narration on initial load, not on language change
        if (sessionStorage.getItem("firstVisit") !== "true") {
          sessionStorage.setItem("firstVisit", "true")
          window.speechSynthesis.speak(utterance)
        }
      }
    }
  }, [language])

  return (
    <section className="bg-white py-12 px-4 md:py-24 min-h-[90vh] flex items-center">
      <div className="container mx-auto text-center">
        <h1 ref={headlineRef} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          {t("hero.headline")}
        </h1>
        <p ref={subheadlineRef} className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
          {t("hero.subheadline")}
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
          <Button
            asChild
            size="lg"
            className="text-xl font-medium h-16 px-8 bg-blue-500 hover:bg-blue-600 transform transition-transform active:scale-95"
            onClick={trackJoinClick}
          >
            <Link href="/signup">{t("cta.join")}</Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="text-xl font-medium h-16 px-8 text-orange-500 border-orange-500 hover:bg-orange-50 transform transition-transform active:scale-95"
            onClick={trackDownloadClick}
          >
            <Download className="mr-2 h-5 w-5" />
            {t("cta.download")}
          </Button>
        </div>
      </div>
    </section>
  )
}
