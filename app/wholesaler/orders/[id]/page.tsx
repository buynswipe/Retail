import ClientOnly from "@/app/components/client-only"
import WholesalerOrderDetailsContent from "./wholesaler-order-details-content"

export const dynamic = "force-dynamic"

export default function WholesalerOrderDetailsPage({ params }: { params: { id: string } }) {
  return (
    <ClientOnly>
      <WholesalerOrderDetailsContent orderId={params.id} />
    </ClientOnly>
  )
}
