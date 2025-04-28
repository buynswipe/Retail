"use client"

import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { NotificationProvider } from "@/lib/notification-context"
import { ThemeProvider } from "@/components/theme-provider"
import { OfflineProvider } from "@/lib/offline-context"
import { registerServiceWorker } from "@/lib/service-worker"
import { useEffect, useState } from "react"
import initializeDemoData from "@/lib/demo-data-service"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isDemoDataInitialized, setIsDemoDataInitialized] = useState(false)

  useEffect(() => {
    // Register service worker (will be skipped in v0 preview)
    registerServiceWorker()

    // Initialize demo data
    const setupDemoData = async () => {
      if (!isDemoDataInitialized) {
        try {
          await initializeDemoData()
          setIsDemoDataInitialized(true)
          console.log("Demo data initialized successfully")
        } catch (error) {
          console.error("Error initializing demo data:", error)
        }
      }
    }

    setupDemoData()
  }, [isDemoDataInitialized])

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <OfflineProvider>{children}</OfflineProvider>
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
