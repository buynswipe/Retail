"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Navbar from "../../components/navbar"
import { TranslationProvider } from "../../components/translation-provider"

export default function PaymentStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<"success" | "failure" | "pending" | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        // Get parameters from URL
        const status = searchParams.get("status")
        const orderId = searchParams.get("orderId") || searchParams.get("udf1")
        const txnId = searchParams.get("txnid")
        const paymentId = searchParams.get("mihpayid")
        const errorCode = searchParams.get("error")
        const errorMessage = searchParams.get("error_Message")

        if (!orderId) {
          setErrorMessage("Missing order information")
          setStatus("failure")
          setIsLoading(false)
          return
        }

        setOrderId(orderId)
        setPaymentId(paymentId || txnId || null)

        // If status is directly provided in URL (common for PayU redirects)
        if (status === "success" || status === "failure") {
          setStatus(status)

          // Verify the payment status with our backend
          const response = await fetch(`/api/payments/verify-status?orderId=${orderId}`)
          const data = await response.json()

          if (data.status !== status) {
            console.warn("Payment status mismatch between URL and backend")
            setStatus(data.status === "completed" ? "success" : data.status === "failed" ? "failure" : "pending")
          }
        } else {
          // If no status in URL, check with backend
          const response = await fetch(`/api/payments/verify-status?orderId=${orderId}`)
          const data = await response.json()

          setStatus(data.status === "completed" ? "success" : data.status === "failed" ? "failure" : "pending")
        }

        if (errorCode || errorMessage) {
          setErrorMessage(errorMessage || `Error code: ${errorCode}`)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error verifying payment status:", error)
        setStatus("pending")
        setErrorMessage("Could not verify payment status")
        setIsLoading(false)
      }
    }

    fetchPaymentStatus()
  }, [searchParams])

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/retailer/orders/${orderId}`)
    } else {
      router.push("/retailer/orders")
    }
  }

  const handleContinueShopping = () => {
    router.push("/retailer/browse")
  }

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                {isLoading ? (
                  <div className="py-8">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-lg">Verifying payment status...</p>
                  </div>
                ) : status === "success" ? (
                  <div className="py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful</h2>
                    <p className="mb-6">Your payment has been processed successfully.</p>
                    {paymentId && <p className="text-sm text-gray-500 mb-6">Payment Reference: {paymentId}</p>}
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                      <Button onClick={handleViewOrder}>View Order</Button>
                      <Button variant="outline" onClick={handleContinueShopping}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                ) : status === "failure" ? (
                  <div className="py-8">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                    <p className="mb-2">Your payment could not be processed.</p>
                    {errorMessage && <p className="text-sm text-red-500 mb-6">Reason: {errorMessage}</p>}
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                      <Button onClick={handleViewOrder}>View Order</Button>
                      <Button variant="outline" onClick={handleContinueShopping}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Pending</h2>
                    <p className="mb-6">Your payment is being processed. Please check your order status later.</p>
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                      <Button onClick={handleViewOrder}>View Order</Button>
                      <Button variant="outline" onClick={handleContinueShopping}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
