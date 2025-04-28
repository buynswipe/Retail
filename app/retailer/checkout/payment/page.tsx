import ClientOnly from "@/app/components/client-only"
import PaymentContent from "./payment-content"

export const dynamic = "force-dynamic"

export default function PaymentPage() {
  return (
    <ClientOnly>
      <PaymentContent />
    </ClientOnly>
  )
}
