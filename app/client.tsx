"use client"

import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { NotificationProvider } from "@/lib/notification-context"
import { OfflineProvider } from "@/lib/offline-context"
import { registerServiceWorker } from "@/lib/service-worker"
import { useEffect, useState } from "react"
import initializeDemoData from "@/lib/demo-data-service"
import { initPerformanceMonitoring } from "@/lib/performance-monitoring"

const inter = Inter({ subsets: ["latin"] })

function ClientInit() {
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring()
  }, [])

  return null // This component doesn't render anything
}

export default function Providers({ children }: { children: React.ReactNode }) {
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
    <AuthProvider>
      <ClientInit />

      <NotificationProvider>
        <OfflineProvider>
          <CartProvider>{children}</CartProvider>
        </OfflineProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}
