"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { initializePayuPayment } from "@/app/actions/payment-actions"
import { useToast } from "@/hooks/use-toast"

interface PayUPaymentProps {
  orderId: string
  amount: number
  productInfo: string
  firstName: string
  email: string
  phone: string
  onPaymentStart?: () => void
  onPaymentCancel?: () => void
}

export function PayUPayment({
  orderId,
  amount,
  productInfo,
  firstName,
  email,
  phone,
  onPaymentStart,
  onPaymentCancel,
}: PayUPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePayNow = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (onPaymentStart) {
        onPaymentStart()
      }

      // Create form data for the server action
      const formData = new FormData()
      formData.append("orderId", orderId)
      formData.append("amount", amount.toString())
      formData.append("productInfo", productInfo)
      formData.append("firstName", firstName)
      formData.append("email", email)
      formData.append("phone", phone)
      formData.append("origin", window.location.origin)

      // Call the server action to initialize payment
      const result = await initializePayuPayment(formData)

      if (!result.success) {
        throw new Error(result.error || "Failed to initialize payment")
      }

      // Create a form and submit it
      const form = document.createElement("form")
      form.method = "POST"
      form.action = result.paymentUrl
      form.style.display = "none"

      // Add all fields to the form
      Object.entries(result.paymentData).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value as string
        form.appendChild(input)
      })

      // Add the form to the body and submit it
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel()
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
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-medium">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">₹{amount.toFixed(2)}</span>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handlePayNow} disabled={isLoading}>
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
