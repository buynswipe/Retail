import ClientOnly from "@/app/components/client-only"
import OrderDetailsContent from "./order-details-content"

export const dynamic = "force-dynamic"

export default function RetailerOrderDetailsPage({ params }: { params: { id: string } }) {
  return (
    <ClientOnly>
      <OrderDetailsContent orderId={params.id} />
    </ClientOnly>
  )
}
