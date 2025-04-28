import ClientOnly from "@/app/components/client-only"
import WholesalerOrdersContent from "./wholesaler-orders-content"

export const dynamic = "force-dynamic"

export default function WholesalerOrdersPage() {
  return (
    <ClientOnly>
      <WholesalerOrdersContent />
    </ClientOnly>
  )
}
