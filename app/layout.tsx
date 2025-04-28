import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TranslationProvider } from "@/app/components/translation-provider"
import { AuthProvider } from "@/lib/auth-context"
import { OfflineProvider } from "@/lib/offline-context"
import { NotificationProvider } from "@/lib/notification-context"
import { CartProvider } from "@/lib/cart-context"
import ClientOnly from "./components/client-only"
import EnvironmentCheck from "./env-check"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Retail Bandhu - Connecting Retailers and Wholesalers",
  description: "A platform for streamlining FMCG supply chain operations",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ClientOnly>
            <EnvironmentCheck />
            <AuthProvider>
              <TranslationProvider>
                <OfflineProvider>
                  <NotificationProvider>
                    <CartProvider>{children}</CartProvider>
                  </NotificationProvider>
                </OfflineProvider>
              </TranslationProvider>
            </AuthProvider>
          </ClientOnly>
        </ThemeProvider>
      </body>
    </html>
  )
}
