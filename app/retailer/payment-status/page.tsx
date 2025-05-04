"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { verifyPayUCallback } from "@/lib/payment-service"

export default function PaymentStatusPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "failure">("loading")
  const [message, setMessage] = useState("Verifying payment status...")
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get all params from the URL
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })

        // Extract key parameters
        const txnId = params.txnid || ""
        const orderIdParam = params.udf1 || "" // Assuming orderId is stored in udf1
        setOrderId(orderIdParam)

        if (params.status === "success") {
          // Verify the payment with our backend
          const result = await verifyPayUCallback(params)

          if (result.success) {
            setStatus("success")
            setMessage("Payment successful! Your order has been confirmed.")
          } else {
            setStatus("failure")
            setMessage(result.error || "Payment verification failed. Please contact support.")
          }
        } else {
          setStatus("failure")
          setMessage(params.error || "Payment failed. Please try again.")
        }
      } catch (error) {
        setStatus("failure")
        setMessage("An error occurred while verifying the payment. Please contact support.")
        console.error("Payment verification error:", error)
      }
    }

    verifyPayment()
  }, [searchParams])

  const handleContinue = () => {
    if (status === "success" && orderId) {
      router.push(`/retailer/orders/${orderId}`)
    } else {
      router.push("/retailer/orders")
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading"
              ? "Processing Payment"
              : status === "success"
                ? "Payment Successful"
                : "Payment Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "loading"
              ? "Please wait while we verify your payment"
              : status === "success"
                ? "Your transaction has been completed"
                : "There was an issue with your payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "loading" ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : status === "success" ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
          <p className="mt-4 text-center">{message}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full" disabled={status === "loading"}>
            {status === "success" ? "View Order" : "Go to Orders"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
