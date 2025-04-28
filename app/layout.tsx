import type React from "react"
import type { Metadata } from "next"
import Client from "./client"

export const metadata: Metadata = {
  title: "RetailBandhu - Connecting Retailers and Wholesalers",
  description: "A platform for retailers and wholesalers to connect and do business efficiently",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Client children={children} />
}


import './globals.css'