"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { initiateCashOnDeliveryPayment } from "@/lib/payment-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Banknote } from "lucide-react"

interface CashOnDeliveryPaymentProps {
  orderId: string
  amount: number
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

export function CashOnDeliveryPayment({ orderId, amount, onSuccess, onFailure }: CashOnDeliveryPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const response = await initiateCashOnDeliveryPayment({
        orderId,
        amount,
        customerName: "Customer", // These values aren't critical for COD
        customerEmail: "customer@example.com",
        customerPhone: "",
      })

      if (response.success) {
        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed with Cash on Delivery payment method.",
        })
        onSuccess(response.paymentId || "")
      } else {
        setIsLoading(false)
        toast({
          title: "Order Error",
          description: response.error || "Failed to place order with Cash on Delivery",
          variant: "destructive",
        })
        onFailure(response.error || "Failed to place order with Cash on Delivery")
      }
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Order Error",
        description: errorMessage,
        variant: "destructive",
      })
      onFailure(errorMessage)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cash on Delivery</CardTitle>
        <CardDescription>Pay when your order is delivered</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Order ID</p>
              <p className="text-sm text-gray-500">{orderId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Amount</p>
              <p className="text-sm text-gray-500">₹{amount.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <p className="text-amber-800 text-sm">
              <Banknote className="inline-block mr-2 h-4 w-4" />
              Please keep the exact amount ready at the time of delivery.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePayment} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Order with COD"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
