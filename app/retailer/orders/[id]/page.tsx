"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { getOrderById } from "@/lib/order-service"
import { getPaymentByOrderId, verifyUpiPayment } from "@/lib/payment-service"
import { getDeliveryAssignmentByOrderId } from "@/lib/delivery-service"
import { ArrowLeft, Package, Truck, Calendar, DollarSign, CheckCircle, Loader2 } from "lucide-react"
import type { Order, Payment, DeliveryAssignment } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function OrderDetailsContent() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && id) {
      loadOrderDetails(id as string)
    }
  }, [user, id])

  const loadOrderDetails = async (orderId: string) => {
    setIsLoading(true)
    try {
      // Load order details
      const { data: orderData, error: orderError } = await getOrderById(orderId)
      if (orderError) {
        throw orderError
      }
      setOrder(orderData)

      // Load payment details
      const { data: paymentData } = await getPaymentByOrderId(orderId)
      setPayment(paymentData)

      // Load delivery details
      const { data: deliveryData } = await getDeliveryAssignmentByOrderId(orderId)
      setDelivery(deliveryData)
    } catch (error) {
      console.error("Error loading order details:", error)
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!payment) return

    setIsSubmitting(true)
    try {
      const { success, error } = await verifyUpiPayment({
        payment_id: payment.id,
        transaction_id: transactionId,
      })

      if (error) {
        throw error
      }

      if (success) {
        toast({
          title: "Payment Verified",
          description: "Your payment has been verified successfully.",
        })
        setIsPaymentDialogOpen(false)
        // Reload order details to get updated payment status
        loadOrderDetails(id as string)
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      toast({
        title: "Error",
        description: "Failed to verify payment. Please check the transaction ID and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-blue-500"
      case "confirmed":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "dispatched":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-700"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "accepted":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "declined":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading order details...</span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
          Back
        </Button>
        <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
      </div>

      {/* Order Status */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Badge className={`${getStatusColor(order.status)} text-white px-3 py-1 text-sm`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-500">Placed on {formatDate(order.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="mb-6">
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
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product?.name}</h4>
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

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{(order.total_amount - order.delivery_charge).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery Fee</span>
              <span>₹{order.delivery_charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery GST</span>
              <span>₹{order.delivery_charge_gst.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {payment ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Payment Method</p>
                  <p className="text-gray-500">{payment.payment_method.toUpperCase()}</p>
                </div>
                <Badge className={`${getPaymentStatusColor(payment.payment_status)} text-white px-3 py-1`}>
                  {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                </Badge>
              </div>

              {payment.payment_method === "upi" && payment.payment_status === "pending" && (
                <div className="mt-4">
                  <Button onClick={() => setIsPaymentDialogOpen(true)} className="w-full bg-blue-500 hover:bg-blue-600">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Verify UPI Payment
                  </Button>
                </div>
              )}

              {payment.payment_status === "completed" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="font-medium text-green-700">Payment Completed</p>
                    <p className="text-sm text-green-600">
                      {payment.transaction_id
                        ? `Transaction ID: ${payment.transaction_id}`
                        : "Payment has been verified"}
                    </p>
                    {payment.payment_date && (
                      <p className="text-sm text-green-600">Paid on {formatDate(payment.payment_date)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Payment information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Delivery Details</CardTitle>
        </CardHeader>
        <CardContent>
          {delivery ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Delivery Status</p>
                  <p className="text-gray-500">{delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}</p>
                </div>
                <Badge className={`${getDeliveryStatusColor(delivery.status)} text-white px-3 py-1`}>
                  {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                </Badge>
              </div>

              {delivery.delivery_partner && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="font-medium text-blue-700">Delivery Partner</p>
                  <p className="text-sm text-blue-600">{delivery.delivery_partner.name}</p>
                  <p className="text-sm text-blue-600">Phone: {delivery.delivery_partner.phone_number}</p>
                </div>
              )}

              {delivery.status === "completed" && delivery.proof_image_url && (
                <div>
                  <p className="font-medium mb-2">Delivery Proof</p>
                  <img
                    src={delivery.proof_image_url || "/placeholder.svg"}
                    alt="Delivery Proof"
                    className="w-full max-w-xs rounded-md"
                  />
                </div>
              )}
            </div>
          ) : order.status === "placed" || order.status === "confirmed" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center">
              <Truck className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-yellow-700">
                Delivery will be assigned once the order is dispatched by the wholesaler.
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Delivery information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Wholesaler Details */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Wholesaler Details</CardTitle>
        </CardHeader>
        <CardContent>
          {order.wholesaler ? (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Business Name:</span> {order.wholesaler.business_name}
              </p>
              <p>
                <span className="font-medium">Contact Person:</span> {order.wholesaler.name}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {order.wholesaler.phone_number}
              </p>
              {order.wholesaler.gst_number && (
                <p>
                  <span className="font-medium">GST Number:</span> {order.wholesaler.gst_number}
                </p>
              )}
              {order.wholesaler.pin_code && (
                <p>
                  <span className="font-medium">PIN Code:</span> {order.wholesaler.pin_code}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Wholesaler information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Verification Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify UPI Payment</DialogTitle>
            <DialogDescription>
              Enter the UPI transaction ID to verify your payment for order #{order.order_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-id">UPI Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyPayment}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!transactionId || isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
