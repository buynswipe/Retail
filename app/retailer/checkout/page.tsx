"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Package, CreditCard, Truck, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/lib/order-service"
import { createPayment, verifyUpiPayment } from "@/lib/payment-service"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function CheckoutContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { items, wholesalerId, wholesalerName, totalItems, totalAmount, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod")
  const [upiId, setUpiId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [showUpiDialog, setShowUpiDialog] = useState(false)
  const [paymentId, setPaymentId] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [upiVerifying, setUpiVerifying] = useState(false)
  const router = useRouter()

  // Redirect if cart is empty
  if (items.length === 0 && !isSuccess) {
    return (
      <div className="container mx-auto max-w-3xl">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to your cart before checking out.</p>
          <Button asChild className="bg-blue-500 hover:bg-blue-600">
            <Link href="/retailer/browse">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    if (!user || !wholesalerId) return

    setIsProcessing(true)
    try {
      // Validate UPI ID if UPI payment method is selected
      if (paymentMethod === "upi" && !upiId) {
        toast({
          title: "Error",
          description: "Please enter your UPI ID",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Prepare order data
      const orderDataPayload = {
        retailer_id: user.id,
        wholesaler_id: wholesalerId,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        })),
      }

      // Create order
      const { data: orderData, error: orderError } = await createOrder(orderDataPayload)

      if (orderError) {
        throw orderError
      }

      // Create payment record
      const { data: paymentData, error: paymentError } = await createPayment({
        order_id: orderData!.id,
        amount: orderData!.total_amount,
        payment_method: paymentMethod,
        upi_id: paymentMethod === "upi" ? upiId : undefined,
      })

      if (paymentError) {
        throw paymentError
      }

      // If UPI payment, show UPI payment dialog
      if (paymentMethod === "upi") {
        setPaymentId(paymentData!.id)
        setShowUpiDialog(true)
        setOrderNumber(orderData!.order_number)
        setIsProcessing(false)
      } else {
        // For COD, show success message directly
        setIsSuccess(true)
        setOrderNumber(orderData!.order_number)
        clearCart()
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleVerifyUpiPayment = async () => {
    if (!transactionId) {
      toast({
        title: "Error",
        description: "Please enter the transaction ID",
        variant: "destructive",
      })
      return
    }

    setUpiVerifying(true)
    try {
      const { success, error } = await verifyUpiPayment({
        payment_id: paymentId,
        transaction_id: transactionId,
      })

      if (!success) {
        throw error
      }

      // Close dialog and show success message
      setShowUpiDialog(false)
      setIsSuccess(true)
      clearCart()
    } catch (error) {
      console.error("Error verifying UPI payment:", error)
      toast({
        title: "Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpiVerifying(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl">
      {isSuccess ? (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-500 mb-6">
              Your order #{orderNumber} has been placed successfully. You can track your order in the orders section.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-blue-500 hover:bg-blue-600">
                <Link href="/retailer/orders">View Orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/retailer/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <Button asChild variant="ghost">
              <Link href="/retailer/browse">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Shopping
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="font-semibold">Wholesaler</h3>
                      <p>{wholesalerName}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Items ({totalItems})</h3>
                      {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url || "/placeholder.svg"}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span>
                              {item.product.name} x {item.quantity}
                            </span>
                          </div>
                          <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span>Subtotal</span>
                        <span>₹{totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Delivery Fee</span>
                        <span>₹50.00</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg mt-2">
                        <span>Total</span>
                        <span>₹{(totalAmount + 50).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Truck className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium">{user?.name || "Your Name"}</p>
                      <p className="text-gray-500">{user?.businessName || "Your Business"}</p>
                      <p className="text-gray-500">PIN: {user?.pinCode || "Your PIN Code"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method */}
            <div className="md:col-span-1">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cod" | "upi")}>
                    <div className="flex items-center space-x-2 mb-4">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        UPI Payment
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "upi" && (
                    <div className="mt-4">
                      <Label htmlFor="upi-id">UPI ID</Label>
                      <Input
                        id="upi-id"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your UPI ID to make payment (e.g., yourname@okaxis)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={handlePlaceOrder}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* UPI Payment Dialog */}
      <Dialog open={showUpiDialog} onOpenChange={setShowUpiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete UPI Payment</DialogTitle>
            <DialogDescription>
              Please complete the payment using your UPI app and enter the transaction ID below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Instructions</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal pl-4 space-y-2 mt-2">
                  <li>Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Send ₹{(totalAmount + 50).toFixed(2)} to retailbandhu@okaxis</li>
                  <li>Copy the transaction ID from your UPI app</li>
                  <li>Paste the transaction ID below and click Verify</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium">Order Details</p>
              <p className="text-sm text-gray-500">Order #{orderNumber}</p>
              <p className="text-sm text-gray-500">Amount: ₹{(totalAmount + 50).toFixed(2)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpiDialog(false)
                router.push("/retailer/orders")
              }}
            >
              Pay Later
            </Button>
            <Button onClick={handleVerifyUpiPayment} disabled={upiVerifying} className="bg-blue-500 hover:bg-blue-600">
              {upiVerifying ? "Verifying..." : "Verify Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <CheckoutContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
