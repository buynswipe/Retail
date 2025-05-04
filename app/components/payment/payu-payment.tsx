"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { initiatePayUPayment } from "@/lib/payment-service"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface PayUPaymentProps {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

export function PayUPayment({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}: PayUPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const response = await initiatePayUPayment({
        orderId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        productInfo: `Order #${orderId}`,
      })

      if (response.success) {
        // PayU requires a form submission to their payment page
        const form = document.createElement("form")
        form.method = "POST"
        form.action = response.paymentUrl

        // Add all the required fields
        Object.entries(response.formParams).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
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
        <CardTitle>Pay with PayU</CardTitle>
        <CardDescription>Secure payment via PayU</CardDescription>
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
            "Pay Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
