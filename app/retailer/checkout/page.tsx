"use client"

import ClientOnly from "@/app/components/client-only"
import CheckoutContent from "./checkout-content"

// Prevent static generation
export const dynamic = "force-dynamic"

export default function CheckoutPage() {
  return (
    <ClientOnly>
      <CheckoutContent />
    </ClientOnly>
  )
}
