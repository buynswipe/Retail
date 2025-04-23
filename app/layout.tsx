import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import EnvSetup from "./env-setup"
import { ErrorBoundary } from "./components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Retail Bandhu - Connecting Retailers and Wholesalers",
  description: "A platform for retailers and wholesalers to connect and do business",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <EnvSetup />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
