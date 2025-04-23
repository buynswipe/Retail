"use client"

import { useTranslation } from "./translation-provider"
import Link from "next/link"
import { MessageCircle, Twitter } from "lucide-react"

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-100 py-12 px-4 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="font-bold text-2xl text-blue-600">RetailBandhu</span>
            </Link>
            <p className="text-lg text-gray-600 max-w-xs">
              Connecting retailers, wholesalers, and delivery partners for a streamlined FMCG supply chain.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Links</h3>
            <nav className="flex flex-col space-y-3">
              <Link href="/privacy" className="text-lg text-gray-600 hover:text-blue-600">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="text-lg text-gray-600 hover:text-blue-600">
                {t("footer.terms")}
              </Link>
              <Link href="/contact" className="text-lg text-gray-600 hover:text-blue-600">
                {t("footer.contact")}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <Link
                href="https://wa.me/919876543210"
                className="text-gray-600 hover:text-green-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-8 w-8" />
                <span className="sr-only">WhatsApp</span>
              </Link>
              <Link
                href="https://twitter.com/retailbandhu"
                className="text-gray-600 hover:text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-8 w-8" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600">&copy; {new Date().getFullYear()} Retail Bandhu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
