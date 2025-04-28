"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PaymentErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId")
  const errorMessage = searchParams.get("error")

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-red-50 p-3 mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-gray-500 mb-6">
                {errorMessage || "There was an issue processing your payment. Please try again."}
              </p>

              <div className="space-y-3 w-full">
                {orderId && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/retailer/checkout/payment?orderId=${orderId}`}>
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Try Again
                    </Link>
                  </Button>
                )}

                <Button asChild className="w-full">
                  <Link href="/retailer/orders">View Orders</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
