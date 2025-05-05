"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { trackPaymentEvent } from "@/lib/payment-analytics"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface PaymentRetryProps {
  orderId: string
  paymentId: string
  amount: number
  failureReason?: string
  onRetrySuccess?: () => void
  onRetryFailure?: (error: any) => void
}

export function PaymentRetry({
  orderId,
  paymentId,
  amount,
  failureReason,
  onRetrySuccess,
  onRetryFailure,
}: PaymentRetryProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryStatus, setRetryStatus] = useState<"idle" | "retrying" | "success" | "failure">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryStatus("retrying")
    setError(null)

    try {
      // Track payment retry event
      await trackPaymentEvent({
        event_type: "payment_retried",
        user_id: user?.id || "",
        order_id: orderId,
        payment_id: paymentId,
        payment_method: "payu", // Default to PayU for now
        amount,
        gateway: "payu",
      })

      // Redirect to checkout page with retry parameters
      router.push(`/retailer/checkout?retry=true&orderId=${orderId}&paymentId=${paymentId}`)

      // Note: The actual retry logic will be handled in the checkout page
      // This is just to track the retry attempt and redirect

      if (onRetrySuccess) {
        onRetrySuccess()
      }
    } catch (err: any) {
      console.error("Payment retry failed:", err)
      setRetryStatus("failure")
      setError(err.message || "Failed to retry payment. Please try again.")

      if (onRetryFailure) {
        onRetryFailure(err)
      }
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          Payment Failed
        </CardTitle>
        <CardDescription>
          Your payment for order #{orderId.slice(0, 8)} was not successful. You can retry the payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Reason for failure</p>
                <p className="text-red-700 text-sm mt-1">
                  {failureReason || "The payment could not be processed. Please try again."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">{orderId.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">₹{amount.toFixed(2)}</p>
            </div>
          </div>

          {retryStatus === "failure" && error && (
            <div className="p-4 bg-red-50 rounded-md border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/retailer/orders/${orderId}`)}>
          View Order
        </Button>
        <Button onClick={handleRetry} disabled={isRetrying}>
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Payment
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PaymentRetrySuccess({ orderId, onViewOrder }: { orderId: string; onViewOrder?: () => void }) {
  const router = useRouter()

  const handleViewOrder = () => {
    if (onViewOrder) {
      onViewOrder()
    } else {
      router.push(`/retailer/orders/${orderId}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Payment Successful
        </CardTitle>
        <CardDescription>Your payment has been successfully processed.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Payment completed</p>
              <p className="text-green-700 text-sm mt-1">
                Your payment for order #{orderId.slice(0, 8)} has been successfully processed.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleViewOrder} className="w-full">
          View Order
        </Button>
      </CardFooter>
    </Card>
  )
}
