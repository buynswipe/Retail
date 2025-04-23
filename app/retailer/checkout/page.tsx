"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Package, CreditCard, Truck, CheckCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/lib/order-service"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"
import Link from "next/link"

function CheckoutContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { items, wholesalerId, wholesalerName, totalItems, totalAmount, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
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
      // Prepare order data
      const orderData = {
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
      const { data, error } = await createOrder(orderData)

      if (error) {
        throw error
      }

      // Show success message
      setIsSuccess(true)
      setOrderNumber(data?.order_number || "")
      clearCart()
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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
