"use client"

import { useABTest } from "@/hooks/use-ab-test"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Hero section A/B test component
export function HeroSectionTest() {
  const router = useRouter()
  const { variant, isLoaded, trackConversion } = useABTest({
    testId: "homepage-hero-test",
    variants: ["A", "B"],
    defaultVariant: "A",
  })

  if (!isLoaded) {
    return <div className="h-[500px] bg-gray-100 animate-pulse" />
  }

  const handleCTAClick = () => {
    trackConversion("hero_cta_click")
    router.push("/signup")
  }

  // Variant A: Original design
  if (variant === "A") {
    return (
      <section className="relative bg-white overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Connect with Wholesalers Directly
              </h1>
              <p className="text-xl text-gray-600">
                RetailBandhu helps retailers find the best wholesale deals and manage their inventory efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleCTAClick}>
                  Get Started
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/about")}>
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/strategic-synergy.png"
                alt="RetailBandhu platform"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Variant B: New design with stronger value proposition
  return (
    <section className="relative bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Trusted by 10,000+ retailers across India
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Grow Your Business with Direct Wholesale Access
            </h1>
            <p className="text-xl text-gray-600">
              Save up to 20% on inventory costs and manage your entire supply chain in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleCTAClick}>
                Start Saving Today
              </Button>
              <Button size="lg" variant="outline" onClick={() => trackConversion("demo_request")}>
                Request Demo
              </Button>
            </div>
          </div>
          <div className="relative h-[450px]">
            <Image
              src="/busy-shop-owner.png"
              alt="Shop owner using RetailBandhu"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
