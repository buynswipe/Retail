"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  useEffect(() => {
    // Extract parameters from URL
    const orderIdParam = searchParams.get("udf1") // Order ID is stored in udf1
    const txnIdParam = searchParams.get("txnid")

    setOrderId(orderIdParam)
    setTransactionId(txnIdParam)

    // Show success toast
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully.",
    })
  }, [searchParams, toast])

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/retailer/orders/${orderId}`)
    } else {
      router.push("/retailer/orders")
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Payment Successful</CardTitle>
          <CardDescription className="text-center">Your transaction has been completed</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div className="mt-6 text-center space-y-2">
            <p>Thank you for your payment. Your order has been confirmed.</p>
            {transactionId && (
              <p className="text-sm text-gray-500">
                Transaction ID: <span className="font-mono">{transactionId}</span>
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleViewOrder} className="w-full">
            View Order Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
