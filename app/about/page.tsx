"use client"

import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, ShieldCheck, Truck, Store } from "lucide-react"

function AboutContent() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Retail Bandhu</h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto">
          Connecting retailers and wholesalers across India with a simple, efficient digital platform.
        </p>
      </div>

      {/* Our Mission */}
      <div className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              At Retail Bandhu, our mission is to transform the traditional retail supply chain by creating a digital
              ecosystem that empowers small retailers and wholesalers across India.
            </p>
            <p className="text-gray-600 mb-4">
              We believe that technology should be accessible to businesses of all sizes, enabling them to grow,
              compete, and thrive in the modern economy.
            </p>
            <p className="text-gray-600">
              By connecting retailers directly with wholesalers, we eliminate inefficiencies, reduce costs, and create a
              more transparent and equitable marketplace for all.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-8">
            <img src="/strategic-synergy.png" alt="Our Mission" className="rounded-lg w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 bg-blue-50 rounded-lg p-8">
            <img src="/busy-shop-owner.png" alt="Our Story" className="rounded-lg w-full h-auto" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Retail Bandhu was founded in 2023 with a simple observation: small retailers in India face significant
              challenges in sourcing products efficiently, while wholesalers struggle to reach a wider customer base.
            </p>
            <p className="text-gray-600 mb-4">
              Our founders, who grew up in families with retail businesses, experienced these challenges firsthand and
              recognized the potential for technology to bridge this gap.
            </p>
            <p className="text-gray-600">
              Starting with a small pilot in one city, Retail Bandhu quickly demonstrated its value to both retailers
              and wholesalers. Today, we're expanding across India, bringing our platform to thousands of businesses and
              transforming how they operate.
            </p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Community First</h3>
              <p className="text-gray-600">
                We believe in building strong communities of retailers and wholesalers who support each other's growth
                and success.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <TrendingUp className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Empowering Growth</h3>
              <p className="text-gray-600">
                We're committed to providing tools and resources that help small businesses grow and compete
                effectively.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <ShieldCheck className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Trust & Transparency</h3>
              <p className="text-gray-600">
                We foster trust through transparent pricing, clear communication, and reliable service at every step.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How We Help */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">How We Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <Store className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">For Retailers</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Access to a wide range of products at wholesale prices</li>
              <li>• Simplified ordering process with multiple payment options</li>
              <li>• Reliable delivery to your doorstep</li>
              <li>• Business analytics to optimize inventory and sales</li>
              <li>• Digital record-keeping for tax compliance</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <Truck className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">For Wholesalers</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Expanded customer base beyond geographical limitations</li>
              <li>• Streamlined order management and fulfillment</li>
              <li>• Secure and timely payments</li>
              <li>• Reduced operational costs</li>
              <li>• Valuable insights into market trends and customer preferences</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Join Us */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Join the Retail Bandhu Community</h2>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-6">
          Be part of the digital transformation of India's retail ecosystem. Whether you're a retailer, wholesaler, or
          delivery partner, there's a place for you in our community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => (window.location.href = "/signup")} className="bg-blue-500 hover:bg-blue-600">
            Sign Up Now
          </Button>
          <Button onClick={() => (window.location.href = "/contact")} variant="outline">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <AboutContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
