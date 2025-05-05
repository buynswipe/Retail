"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { getPaymentByOrderId } from "@/lib/payment-service"
import { PaymentReceipt } from "../../../components/payment/payment-receipt"
import { PayUPaymentForm } from "../../../components/payment/payu-payment-form"
import { ArrowLeft, Package, Truck, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Receipt } from "lucide-react"
import type { Order, Payment } from "@/lib/types"

function OrderDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const [payuData, setPayuData] = useState<any>(null)
  const [payuUrl, setPayuUrl] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Check for payment status in URL (from PayU redirect)
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success" || status === "failure") {
      // Show toast based on payment status
      if (status === "success") {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        })
      } else {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        })
      }

      // Remove status from URL to prevent showing the toast again on refresh
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const orderId = params.id as string

        // Fetch order details
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            retailer:retailer_id(*),
            wholesaler:wholesaler_id(*),
            items:order_items(*, product:product_id(*))
          `,
          )
          .eq("id", orderId)
          .eq("retailer_id", user.id)
          .single()

        if (error) {
          throw error
        }

        setOrder(data)

        // Fetch payment details
        const { data: paymentData, error: paymentError } = await getPaymentByOrderId(orderId)

        if (!paymentError && paymentData) {
          setPayment(paymentData)
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [params.id, user])

  const handleRetryPayment = async () => {
    if (!order) return

    setIsLoading(true)
    try {
      // Initialize PayU payment
      const response = await fetch("/api/payments/payu/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total_amount + (order.delivery_charge || 0) + (order.delivery_charge_gst || 0),
          currency: "INR",
          redirectUrl: `${window.location.origin}/retailer/orders/${order.id}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize payment")
      }

      const payuResponse = await response.json()

      if (payuResponse.success) {
        setPayuData(payuResponse.payuData)
        setPayuUrl(payuResponse.payuUrl)
        setIsRedirecting(true)
      } else {
        throw new Error(payuResponse.message || "Payment initialization failed")
      }
    } catch (error) {
      console.error("Error retrying payment:", error)
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return <Badge variant="outline">Placed</Badge>
      case "confirmed":
        return <Badge variant="secondary">Confirmed</Badge>
      case "dispatched":
        return <Badge variant="default">Dispatched</Badge>
      case "delivered":
        return <Badge variant="success">Delivered</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => router.push("/retailer/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/retailer/orders")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          {payment && payment.payment_status === "completed" && <TabsTrigger value="receipt">Receipt</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Date</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Wholesaler</span>
                      <span>{order.wholesaler?.business_name || "Unknown Wholesaler"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="capitalize">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Payment Status</span>
                      <div className="flex items-center">
                        {getPaymentStatusIcon(order.payment_status)}
                        <span className="ml-2 capitalize">{order.payment_status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                          {item.product?.image_url ? (
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
                          <h4 className="font-medium">{item.product?.name || `Product #${item.product_id}`}</h4>
                          <p className="text-sm text-gray-500">
                            {item.quantity} x ₹{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{item.total_price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span>₹{(order.delivery_charge || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST</span>
                      <span>₹{(order.delivery_charge_gst || 0).toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        ₹
                        {(order.total_amount + (order.delivery_charge || 0) + (order.delivery_charge_gst || 0)).toFixed(
                          2,
                        )}
                      </span>
                    </div>

                    {order.status === "placed" && order.payment_status === "pending" && (
                      <div className="mt-6">
                        <Button onClick={handleRetryPayment} className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Processing...
                            </div>
                          ) : (
                            "Pay Now"
                          )}
                        </Button>
                      </div>
                    )}

                    {order.status === "dispatched" && (
                      <div className="mt-6 bg-blue-50 p-4 rounded-md">
                        <div className="flex items-center">
                          <Truck className="h-5 w-5 text-blue-500 mr-2" />
                          <p className="text-blue-700">Your order is on the way!</p>
                        </div>
                      </div>
                    )}

                    {order.status === "delivered" && (
                      <div className="mt-6 bg-green-50 p-4 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <p className="text-green-700">Your order has been delivered!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {payment ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="capitalize">{payment.payment_method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <div className="flex items-center">
                      {getPaymentStatusIcon(payment.payment_status)}
                      <span className="ml-2 capitalize">{payment.payment_status}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span>₹{payment.amount.toFixed(2)}</span>
                  </div>
                  {payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span>{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.reference_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference ID</span>
                      <span>{payment.reference_id}</span>
                    </div>
                  )}
                  {payment.payment_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Date</span>
                      <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {payment.payment_status === "pending" && (
                    <div className="mt-6">
                      <Button onClick={handleRetryPayment} className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Processing...
                          </div>
                        ) : (
                          "Retry Payment"
                        )}
                      </Button>
                    </div>
                  )}

                  {payment.payment_status === "completed" && (
                    <div className="mt-6 bg-green-50 p-4 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-green-700">Payment completed successfully!</p>
                      </div>
                    </div>
                  )}

                  {payment.payment_status === "failed" && (
                    <div className="mt-6 bg-red-50 p-4 rounded-md">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-700">Payment failed. Please try again.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
                  <h2 className="text-xl font-bold mb-2">No Payment Information</h2>
                  <p className="text-gray-500 mb-6">Payment details are not available for this order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {payment && payment.payment_status === "completed" && (
          <TabsContent value="receipt">
            <div className="flex items-center mb-4">
              <Receipt className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="text-xl font-bold">Payment Receipt</h2>
            </div>
            <PaymentReceipt payment={payment} order={order} />
          </TabsContent>
        )}
      </Tabs>

      {isRedirecting && payuData && (
        <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
          <PayUPaymentForm payuData={payuData} payuUrl={payuUrl} />
        </div>
      )}

      <Toaster />
    </div>
  )
}

export default function OrderDetailsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <OrderDetailsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
