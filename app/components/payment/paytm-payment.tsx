"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { initiatePaytmPayment } from "@/lib/payment-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PaytmPaymentProps {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

export function PaytmPayment({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}: PaytmPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const response = await initiatePaytmPayment({
        orderId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
      })

      if (response.success) {
        // For Paytm, we would typically redirect to their payment page
        // But since we're deprecating it in favor of PayU, we'll just show a message
        setIsLoading(false)
        toast({
          title: "Payment Method Deprecated",
          description: "Paytm payments are being phased out. Please use PayU instead.",
          variant: "destructive",
        })
        onFailure("Paytm payments are being phased out. Please use PayU instead.")
      } else {
        setIsLoading(false)
        toast({
          title: "Payment Error",
          description: response.error || "Failed to initiate payment",
          variant: "destructive",
        })
        onFailure(response.error || "Failed to initiate payment")
      }
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
      onFailure(errorMessage)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Paytm Payment</CardTitle>
        <CardDescription>Pay using Paytm</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-800">
            Paytm payments are being phased out. We recommend using PayU for the best experience.
          </AlertDescription>
        </Alert>
        <div className="mt-4 space-y-4">
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
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePayment} disabled={isLoading || true} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay with Paytm (Deprecated)"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
