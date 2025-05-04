"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentFailurePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("Your payment could not be processed.")

  useEffect(() => {
    // Extract parameters from URL
    const orderIdParam = searchParams.get("udf1") // Order ID is stored in udf1
    const errorParam = searchParams.get("error_Message") || searchParams.get("error")

    setOrderId(orderIdParam)
    if (errorParam) {
      setErrorMessage(errorParam)
    }

    // Show failure toast
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your payment.",
      variant: "destructive",
    })
  }, [searchParams, toast])

  const handleTryAgain = () => {
    if (orderId) {
      router.push(`/retailer/checkout?order=${orderId}`)
    } else {
      router.push("/retailer/checkout")
    }
  }

  const handleViewOrders = () => {
    router.push("/retailer/orders")
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Payment Failed</CardTitle>
          <CardDescription className="text-center">There was an issue with your payment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <XCircle className="h-16 w-16 text-red-500" />
          <div className="mt-6 text-center space-y-2">
            <p>{errorMessage}</p>
            <p className="text-sm text-gray-500">
              Your order has been saved. You can try again or choose a different payment method.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleTryAgain} className="w-full">
            Try Again
          </Button>
          <Button onClick={handleViewOrders} variant="outline" className="w-full">
            View Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
