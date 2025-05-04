"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  order: { id: string; total_amount: number }
  user: { name?: string; email?: string; phone_number?: string } | null | undefined
}

export function PayUPayment({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
  order,
  user,
}: PayUPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const initiatePayment = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Get the base URL
      const baseUrl = window.location.origin

      // Create payment request
      const response = await fetch("/api/payments/payu/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total_amount,
          productInfo: `Order #${order.id}`,
          firstName: user?.name || "Customer",
          email: user?.email || `${user?.phone_number}@example.com`,
          phone: user?.phone_number || "",
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create payment")
      }

      // Create and submit form
      const form = document.createElement("form")
      form.method = "POST"
      form.action = "https://secure.payu.in/_payment" // PayU production URL

      // Add all parameters as hidden fields
      Object.entries(data.paymentParams).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value as string
        form.appendChild(input)
      })

      // Add form to body and submit
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error("Payment initiation error:", error)
      setError("Failed to initiate payment. Please try again.")
      setIsLoading(false)
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
        <Button onClick={initiatePayment} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </CardFooter>
    </Card>
  )
}
