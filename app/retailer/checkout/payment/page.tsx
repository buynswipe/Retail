"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { PaymentMethods } from "@/app/components/payment/payment-methods"
import { PaymentProcessor } from "@/app/components/payment/payment-processor"
import { PaymentSuccess } from "@/app/components/payment/payment-success"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getOrderById } from "@/lib/order-service"
import type { PaymentGateway } from "@/lib/payment-gateway-integration"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, ShoppingCart, Store, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function PaymentPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>("upi")
  const [paymentStep, setPaymentStep] = useState<"select" | "process" | "success">("select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || !orderId) {
        router.push("/retailer/orders")
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await getOrderById(orderId)
        if (error) throw error

        // Verify this order belongs to the current retailer
        if (data && data.retailer_id !== user.id) {
          router.push("/retailer/orders")
          return
        }

        // Check if order is already paid
        if (data && data.payment_status === "paid") {
          router.push(`/retailer/orders/${orderId}?payment=success`)
          return
        }

        setOrder(data)
      } catch (error) {
        console.error("Failed to load order:", error)
        setError(error instanceof Error ? error.message : "Failed to load order details")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadOrder()
    }
  }, [orderId, user, router])

  const handleSelectPaymentMethod = (method: PaymentGateway) => {
    setPaymentMethod(method)
  }

  const handleProceedToPayment = () => {
    setIsProcessing(true)

    // For COD, we'll skip the payment processing step
    if (paymentMethod === "cod") {
      // Redirect to order details with COD parameter
      router.push(`/retailer/orders/${orderId}?payment=cod`)
      return
    }

    setPaymentStep("process")
    setIsProcessing(false)
  }

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentId(paymentId)
    setPaymentStep("success")
  }

  const handlePaymentFailure = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
    setPaymentStep("select")
  }

  const handleBackToPaymentMethods = () => {
    setPaymentStep("select")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">{t("Order not found")}</h2>
              <p className="text-gray-500 mb-6">
                {error || t("The order you're looking for doesn't exist or you don't have permission to view it.")}
              </p>
              <Button asChild>
                <Link href="/retailer/orders">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("Back to Orders")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button variant="outline" asChild className="mb-2">
              <Link href={`/retailer/orders/${order.id}`}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Back to Order")}
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{t("Complete Payment")}</h1>
            <p className="text-gray-500">
              {t("Order")} #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {paymentStep === "select" && (
                <PaymentMethods
                  amount={order.total_amount}
                  onSelectPaymentMethod={handleSelectPaymentMethod}
                  onProceed={handleProceedToPayment}
                  isProcessing={isProcessing}
                />
              )}

              {paymentStep === "process" && (
                <PaymentProcessor
                  orderId={order.id}
                  amount={order.total_amount}
                  customerId={user?.id || ""}
                  customerName={user?.name || ""}
                  customerEmail={user?.email || ""}
                  customerPhone={user?.phone || ""}
                  description={`Payment for order #${order.id.slice(0, 8).toUpperCase()}`}
                  paymentMethod={paymentMethod}
                  onBack={handleBackToPaymentMethods}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                />
              )}

              {paymentStep === "success" && (
                <PaymentSuccess
                  orderId={order.id}
                  amount={order.total_amount}
                  paymentId={paymentId || ""}
                  paymentMethod={
                    paymentMethod === "razorpay"
                      ? "Credit/Debit Card"
                      : paymentMethod === "paytm"
                        ? "Paytm"
                        : paymentMethod === "phonepe"
                          ? "PhonePe"
                          : paymentMethod === "payu"
                            ? "Netbanking"
                            : paymentMethod === "upi"
                              ? "UPI"
                              : "Online Payment"
                  }
                />
              )}
            </div>

            <div>
              <div className="bg-gray-50 border rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-gray-500" />
                    {t("Order Summary")}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Subtotal")}</span>
                      <span>{formatCurrency(order.total_amount - 50)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Delivery Fee")}</span>
                      <span>{formatCurrency(50)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>{t("Total")}</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <Store className="h-5 w-5 mr-2 text-gray-500" />
                    {t("Wholesaler")}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                      {order.wholesaler?.profile_image ? (
                        <Image
                          src={order.wholesaler.profile_image || "/placeholder.svg"}
                          alt={order.wholesaler.business_name || order.wholesaler.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Store className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{order.wholesaler?.business_name || order.wholesaler?.name}</p>
                      <p className="text-sm text-gray-500">
                        {order.wholesaler?.city}, {order.wholesaler?.state}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    {t("Delivery Address")}
                  </h3>
                  <p className="text-sm">{order.delivery_address}</p>
                  <p className="text-sm mt-1">{order.delivery_contact}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
