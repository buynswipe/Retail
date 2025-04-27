import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DevModeIndicator } from "./components/dev-mode-indicator"
import { AuthProvider } from "@/lib/auth-context"
import { DemoAccountSetup } from "./components/demo-account-setup"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Retail Bandhu",
  description: "Connecting retailers and wholesalers",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <DemoAccountSetup />
            {children}
            <Toaster />
            <DevModeIndicator />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
