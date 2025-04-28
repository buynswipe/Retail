"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createPaymentOrder, verifyPayment } from "@/lib/payment-gateway"
import type { PaymentMethod } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertCircle, Wallet, CreditCard } from "lucide-react"
import Image from "next/image"

interface PaymentFormProps {
  orderId: string
  amount: number
  currency?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function PaymentForm({ orderId, amount, currency = "INR", onSuccess, onError }: PaymentFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const payuFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Fetch available payment methods
    const fetchPaymentMethods = async () => {
      try {
        // In a real app, this would come from an API
        setPaymentMethods(["payu", "cod"])
        setSelectedMethod("payu") // Default selection
      } catch (error) {
        console.error("Error fetching payment methods:", error)
        setErrorMessage("Failed to load payment methods")
      }
    }

    fetchPaymentMethods()
  }, [])

  const handlePaymentMethodChange = (value: string) => {
    setSelectedMethod(value as PaymentMethod)
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setPaymentStatus("processing")

    try {
      // Create payment order
      const result = await createPaymentOrder(orderId, amount, currency, selectedMethod)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create payment order")
      }

      // Handle different payment methods
      if (selectedMethod === "payu") {
        handlePayuPayment(result.data)
      } else if (selectedMethod === "cod") {
        handleCODPayment(result.data)
      }
    } catch (error) {
      console.error("Payment error:", error)
      setPaymentStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Payment failed")
      if (onError) onError(error instanceof Error ? error.message : "Payment failed")
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment failed",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handlePayuPayment = (data: any) => {
    // For PayU, we need to submit a form to their payment gateway
    if (payuFormRef.current) {
      payuFormRef.current.submit()
    }
  }

  const handleCODPayment = async (data: any) => {
    try {
      // Verify COD payment (this is just a formality for COD)
      const verificationResult = await verifyPayment("cod", data.paymentId, {
        method: "cod",
        txnid: `COD_${Date.now()}`,
      })

      if (verificationResult.success) {
        setPaymentStatus("success")
        if (onSuccess) onSuccess()
        toast({
          title: "Order Placed",
          description: "Your order has been placed successfully. Payment will be collected on delivery.",
        })
        router.push(`/retailer/orders/${orderId}?payment=cod`)
      } else {
        throw new Error(verificationResult.error || "Order placement failed")
      }
    } catch (error) {
      console.error("COD order error:", error)
      setPaymentStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Order placement failed")
      if (onError) onError(error instanceof Error ? error.message : "Order placement failed")
    } finally {
      setIsLoading(false)
    }
  }

  const renderPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case "payu":
        return (
          <div className="h-6 w-16 relative">
            <Image src="/payment-icons/payu.svg" alt="PayU" width={64} height={24} />
          </div>
        )
      case "cod":
        return (
          <div className="flex items-center justify-center h-6 w-6 bg-gray-100 rounded-full">
            <span className="text-xs font-bold">₹</span>
          </div>
        )
      default:
        return null
    }
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "payu":
        return "PayU (Credit/Debit Card, UPI, Netbanking)"
      case "cod":
        return "Cash on Delivery"
      default:
        return method
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Choose your preferred payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Order Total</p>
                <p className="text-2xl font-bold">
                  {currency} {amount.toFixed(2)}
                </p>
              </div>
              {paymentStatus === "success" && (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-1 h-5 w-5" />
                  <span>Payment Successful</span>
                </div>
              )}
              {paymentStatus === "error" && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="mr-1 h-5 w-5" />
                  <span>Payment Failed</span>
                </div>
              )}
            </div>

            <Separator />

            {paymentStatus === "idle" || paymentStatus === "error" ? (
              <RadioGroup value={selectedMethod || ""} onValueChange={handlePaymentMethodChange} className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method}
                    className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedMethod(method)}
                  >
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method} className="flex-1 flex items-center cursor-pointer">
                      <div className="mr-3">
                        {method === "payu" ? (
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Wallet className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <span>{getPaymentMethodLabel(method)}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : paymentStatus === "processing" ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Processing your payment...</p>
                <p className="text-sm text-gray-500">Please do not close this window</p>
              </div>
            ) : paymentStatus === "success" ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                <p className="text-lg font-medium">Payment Successful!</p>
                <p className="text-sm text-gray-500">Your order has been placed successfully</p>
              </div>
            ) : null}

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{errorMessage}</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading || paymentStatus === "success"}>
            Back
          </Button>
          {(paymentStatus === "idle" || paymentStatus === "error") && (
            <Button onClick={handlePayment} disabled={!selectedMethod || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                `Pay ${currency} ${amount.toFixed(2)}`
              )}
            </Button>
          )}
          {paymentStatus === "success" && <Button onClick={() => router.push("/retailer/orders")}>View Orders</Button>}
        </CardFooter>
      </Card>

      {/* Hidden form for PayU redirect */}
      {selectedMethod === "payu" && (
        <form
          ref={payuFormRef}
          method="post"
          action="https://secure.payu.in/_payment"
          style={{ display: "none" }}
          id="payu-payment-form"
        >
          {/* These fields will be populated when handlePayuPayment is called */}
        </form>
      )}
    </>
  )
}
