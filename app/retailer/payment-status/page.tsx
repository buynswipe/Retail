"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft, Home } from "lucide-react"
import Navbar from "../../components/navbar"
import { TranslationProvider } from "../../components/translation-provider"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function PaymentStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<"success" | "failure" | "pending" | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

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

          if (!response.ok) {
            throw new Error(`Failed to verify payment status: ${response.statusText}`)
          }

          const data = await response.json()

          if (data.status !== status) {
            console.warn("Payment status mismatch between URL and backend")
            setStatus(data.status === "completed" ? "success" : data.status === "failed" ? "failure" : "pending")
          }
        } else {
          // If no status in URL, check with backend
          const response = await fetch(`/api/payments/verify-status?orderId=${orderId}`)

          if (!response.ok) {
            throw new Error(`Failed to verify payment status: ${response.statusText}`)
          }

          const data = await response.json()

          // If payment is still pending, start polling
          if (data.status === "pending") {
            setStatus("pending")
            setIsPolling(true)
          } else {
            setStatus(data.status === "completed" ? "success" : data.status === "failed" ? "failure" : "pending")
          }
        }

        if (errorCode || errorMessage) {
          setErrorMessage(errorMessage || `Error code: ${errorCode}`)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error verifying payment status:", error)
        setStatus("pending")
        setErrorMessage(error instanceof Error ? error.message : "Could not verify payment status")
        setIsLoading(false)

        // Show toast for error
        toast({
          title: "Error",
          description: "Failed to verify payment status. We'll keep trying.",
          variant: "destructive",
        })
      }
    }

    fetchPaymentStatus()
  }, [searchParams])

  // Polling for pending payments
  useEffect(() => {
    if (!isPolling || !orderId) return

    const MAX_RETRIES = 10
    const POLLING_INTERVAL = 3000 // 3 seconds

    const pollPaymentStatus = async () => {
      try {
        if (retryCount >= MAX_RETRIES) {
          setIsPolling(false)
          return
        }

        const response = await fetch(`/api/payments/verify-status?orderId=${orderId}`)

        if (!response.ok) {
          throw new Error(`Failed to verify payment status: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.status !== "pending") {
          setStatus(data.status === "completed" ? "success" : "failure")
          setIsPolling(false)

          // Show toast for status update
          toast({
            title: data.status === "completed" ? "Payment Successful" : "Payment Failed",
            description:
              data.status === "completed"
                ? "Your payment has been processed successfully."
                : "Your payment could not be processed.",
            variant: data.status === "completed" ? "default" : "destructive",
          })
        } else {
          setRetryCount((prev) => prev + 1)
        }
      } catch (error) {
        console.error("Error polling payment status:", error)
        setRetryCount((prev) => prev + 1)
      }
    }

    const intervalId = setInterval(pollPaymentStatus, POLLING_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isPolling, orderId, retryCount])

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

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/retailer/dashboard")
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
                    <p className="mb-6">
                      {isPolling
                        ? `Your payment is being processed. We're checking the status... (${retryCount}/${10})`
                        : "Your payment is being processed. Please check your order status later."}
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                      <Button onClick={handleViewOrder}>View Order</Button>
                      <Button variant="outline" onClick={handleContinueShopping}>
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between w-full">
                  <Button variant="ghost" size="sm" onClick={handleGoBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGoHome}>
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Toaster />
      </div>
    </TranslationProvider>
  )
}
