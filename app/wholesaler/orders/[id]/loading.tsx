import { Loader2 } from "lucide-react"

export default function WholesalerOrderDetailsLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-gray-600">Loading order details...</p>
      </div>
    </div>
  )
}
