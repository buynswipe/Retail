"use client"

import { useTranslation } from "./translation-provider"
import { Button } from "@/components/ui/button"
import { Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase-client"
import Image from "next/image"

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
    <section className="relative bg-gradient-to-b from-white to-blue-50 py-16 md:py-24 min-h-[90vh] flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium mb-6">
              {t("hero.badge")}
            </div>
            <h1
              ref={headlineRef}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight"
            >
              {t("hero.headline")}
            </h1>
            <p ref={subheadlineRef} className="text-xl md:text-2xl mb-8 text-gray-600 max-w-2xl mx-auto lg:mx-0">
              {t("hero.subheadline")}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Button
                asChild
                size="lg"
                className="text-xl font-medium h-16 px-8 bg-blue-600 hover:bg-blue-700 transform transition-transform active:scale-95 shadow-lg"
                onClick={trackJoinClick}
              >
                <Link href="/signup" className="flex items-center">
                  {t("cta.join")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-xl font-medium h-16 px-8 text-orange-600 border-orange-600 hover:bg-orange-50 transform transition-transform active:scale-95"
                onClick={trackDownloadClick}
              >
                <Download className="mr-2 h-5 w-5" />
                {t("cta.download")}
              </Button>
            </div>

            <div className="mt-8 text-gray-600">
              <p className="text-sm">{t("hero.trusted")}</p>
              <div className="flex justify-center lg:justify-start gap-6 mt-4">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-orange-100 rounded-2xl transform rotate-3 opacity-70"></div>
            <div className="relative bg-white p-6 rounded-xl shadow-lg">
              <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
                <Image src="/stylized-admin-panel.png" alt="Retail Bandhu Platform" fill className="object-cover" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 font-bold text-xl">₹24.5K</div>
                  <div className="text-sm text-gray-600">{t("hero.stats.sales")}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-bold text-xl">42</div>
                  <div className="text-sm text-gray-600">{t("hero.stats.products")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
