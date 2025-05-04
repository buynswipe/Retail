"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/lib/order-service"
import { ArrowLeft, Package, Loader2 } from "lucide-react"
import type { PaymentMethod } from "@/lib/types"

// Import the PaymentMethodSelector
import { PaymentMethodSelector } from "@/app/components/payment/payment-method-selector"

function CheckoutContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { items = [], wholesalerId = "", wholesalerName = "", totalAmount = 0, clearCart = () => {} } = useCart() || {}
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi")
  const [isProcessing, setIsProcessing] = useState(false)
  const [deliveryCharge] = useState(50) // Fixed delivery charge
  const [deliveryGST] = useState(9) // 18% GST on delivery charge
  const [isClient, setIsClient] = useState(false)
  const [order, setOrder] = useState<{ id: string; total_amount: number } | null>(null)

  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true)

    // Redirect to browse if cart is empty
    if (items?.length === 0 || !wholesalerId) {
      router.push("/retailer/browse")
    }
  }, [items, wholesalerId, router])

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to place an order.",
        variant: "destructive",
      })
      return
    }

    if (!wholesalerId) {
      toast({
        title: "Error",
        description: "No wholesaler selected for this order.",
        variant: "destructive",
      })
      return
    }

    if (!items || items.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty. Add some products before checking out.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Validate cart items
      const validItems = items.filter(
        (item) => item && item.product && item.product.id && item.quantity && item.product.price,
      )

      if (validItems.length === 0) {
        throw new Error("No valid items in cart")
      }

      // Create order items from cart
      const orderItems = validItems.map((item) => ({
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

      setOrder({ id: orderData.id, total_amount: orderData.total_amount })

      // Handle payment based on selected method
      // if (paymentMethod === "upi") {
      //   // Initiate PayU payment
      //   const paymentResponse = await initiatePayment({
      //     orderId: orderData.id,
      //     amount: orderData.total_amount,
      //     currency: "INR",
      //     gateway: "payu" as PaymentGateway,
      //     redirectUrl: `${window.location.origin}/retailer/orders/${orderData.id}`,
      //   })

      //   if (!paymentResponse.success) {
      //     throw new Error(paymentResponse.message || "Failed to initiate payment")
      //   }

      //   // Clear cart after successful order
      //   clearCart()

      //   // Redirect to PayU payment page
      //   if (paymentResponse.redirectUrl) {
      //     window.location.href = paymentResponse.redirectUrl
      //     return
      //   }
      // } else {
      //   // Create COD payment record
      //   const { data: paymentData, error: paymentError } = await createPayment({
      //     order_id: orderData.id,
      //     amount: orderData.total_amount,
      //     payment_method: paymentMethod,
      //   })

      //   if (paymentError) {
      //     throw paymentError
      //   }

      //   // Clear cart after successful order
      //   clearCart()

      //   // Redirect to order confirmation page
      //   router.push(`/retailer/orders/${orderData.id}`)
      // }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const totalWithDelivery = totalAmount + deliveryCharge + (deliveryCharge * deliveryGST) / 100

  if (!isClient) {
    return null
  }

  return (
    <div className="container py-10">
      <Toaster />
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back to Browse")}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Order Summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>
                {t("Items")} ({items?.length}):
              </span>
              <span>₹{totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("Delivery")}</span>
              <span>₹{deliveryCharge?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {t("Delivery GST")} ({deliveryGST}%):
              </span>
              <span>₹{((deliveryCharge * deliveryGST) / 100)?.toFixed(2)}</span>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-semibold">
              <span>{t("Total")}</span>
              <span>₹{totalWithDelivery?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Payment Options")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Replace the existing payment method selection with the new component */}
            {/* Find the section where payment methods are rendered and replace it with: */}

            {order && user && (
              <div className="mt-8">
                <PaymentMethodSelector
                  orderId={order.id}
                  amount={order.total_amount}
                  customerName={user.full_name || ""}
                  customerEmail={user.email || ""}
                  customerPhone={user.phone || ""}
                  onSuccess={(paymentId) => {
                    // Handle successful payment
                    toast({
                      title: "Payment Successful",
                      description: `Your payment (ID: ${paymentId}) has been processed successfully.`,
                    })
                    clearCart()
                    router.push(`/retailer/orders/${order.id}`)
                  }}
                  onFailure={(error) => {
                    // Handle payment failure
                    toast({
                      title: "Payment Failed",
                      description: error,
                      variant: "destructive",
                    })
                  }}
                />
              </div>
            )}
            {!order && (
              <Button className="w-full mt-4" onClick={handlePlaceOrder} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Processing...")}
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    {t("Place Order")}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <TranslationProvider>
      <Navbar />
      <CheckoutContent />
    </TranslationProvider>
  )
}
