"use client"

import ClientOnly from "@/app/components/client-only"
import OrdersContent from "./orders-content"

export const dynamic = "force-dynamic"

export default function RetailerOrdersPage() {
  return (
    <ClientOnly>
      <OrdersContent />
    </ClientOnly>
  )
}
