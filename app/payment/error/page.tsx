"use client"

import ClientOnly from "@/app/components/client-only"
import PaymentErrorContent from "./payment-error-content"

export const dynamic = "force-dynamic"

export default function PaymentErrorPage() {
  return (
    <ClientOnly>
      <PaymentErrorContent />
    </ClientOnly>
  )
}
