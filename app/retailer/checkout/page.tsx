"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/lib/order-service"
import { createPayment } from "@/lib/payment-service"
import { ArrowLeft, Package, CreditCard, Banknote, Loader2 } from "lucide-react"
import type { PaymentMethod } from "@/lib/types"

function CheckoutContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { items = [], wholesalerId = "", wholesalerName = "", totalAmount = 0, clearCart } = useCart() || {}
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi")
  const [isProcessing, setIsProcessing] = useState(false)
  const [deliveryCharge] = useState(50) // Fixed delivery charge
  const [deliveryGST] = useState(9) // 18% GST on delivery charge
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true)

    // Redirect to browse if cart is empty
    if (items?.length === 0 || !wholesalerId) {
      router.push("/retailer/browse")
    }
  }, [items, wholesalerId, router])

  const handlePlaceOrder = async () => {
    if (!user || !wholesalerId) return

    setIsProcessing(true)
    try {
      // Create order items from cart
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))

      // Create order
      const { data: orderData, error: orderError } = await createOrder({
        retailer_id: user.id,
        wholesaler_id: wholesalerId,
        items: orderItems,
        payment_method: paymentMethod,
      })

      if (orderError) {
        throw orderError
      }

      if (!orderData) {
        throw new Error("Failed to create order. Please try again.")
      }

      // Create payment record
      const { data: paymentData, error: paymentError } = await createPayment({
        order_id: orderData.id,
        amount: orderData.total_amount,
        payment_method: paymentMethod,
      })

      if (paymentError) {
        throw paymentError
      }

      // Clear cart after successful order
      clearCart()

      // Show success message
      toast({
        title: "Order Placed Successfully",
        description: `Your order #${orderData.order_number} has been placed.`,
      })

      // Redirect to order details page
      router.push(`/retailer/orders/${orderData.id}`)
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

  // Show loading state during SSR or if cart data is not yet available
  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!items || items.length === 0 || !wholesalerId) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Add some products to your cart before proceeding to checkout.</p>
        <Button onClick={() => router.push("/retailer/browse")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/retailer/browse")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shopping
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x ₹{item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    UPI Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2 text-green-500" />
                    Cash on Delivery
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "upi" && (
                <div className="mt-4 bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-700">
                    You will be prompted to enter your UPI transaction ID after placing the order.
                  </p>
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="mt-4 bg-green-50 p-4 rounded-md">
                  <p className="text-green-700">
                    Pay with cash when your order is delivered. Please keep exact change ready.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>₹{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (18%)</span>
                  <span>₹{deliveryGST.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{(totalAmount + deliveryCharge + deliveryGST).toFixed(2)}</span>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Ordering from: {wholesalerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
