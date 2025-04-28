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
import { getOrderById, updateOrderStatus } from "@/lib/order-service"
import { getPaymentByOrderId } from "@/lib/payment-service"
import { ArrowLeft, Package, Calendar, CheckCircle, XCircle, Loader2, Truck } from "lucide-react"
import type { Order, Payment } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function OrderDetailsContent() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"confirm" | "reject" | "dispatch">("confirm")

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

  const handleUpdateStatus = async (status: "confirmed" | "rejected" | "dispatched") => {
    if (!order) return

    setIsUpdating(true)
    try {
      const { success, error } = await updateOrderStatus(order.id, status)

      if (error) {
        throw error
      }

      if (success) {
        toast({
          title: "Order Updated",
          description: `Order has been ${status} successfully.`,
        })
        // Reload order details to get updated status
        loadOrderDetails(id as string)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: `Failed to ${status} order. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setIsConfirmDialogOpen(false)
      setIsRejectDialogOpen(false)
      setIsDispatchDialogOpen(false)
    }
  }

  const openConfirmDialog = () => {
    setActionType("confirm")
    setIsConfirmDialogOpen(true)
  }

  const openRejectDialog = () => {
    setActionType("reject")
    setIsRejectDialogOpen(true)
  }

  const openDispatchDialog = () => {
    setActionType("dispatch")
    setIsDispatchDialogOpen(true)
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
        <Button onClick={() => router.push("/wholesaler/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/wholesaler/orders")} className="mr-4">
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

          {/* Action buttons based on current status */}
          {order.status === "placed" && (
            <div className="flex gap-4 mt-4">
              <Button onClick={openConfirmDialog} className="bg-green-500 hover:bg-green-600" disabled={isUpdating}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
              <Button onClick={openRejectDialog} variant="destructive" disabled={isUpdating}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Order
              </Button>
            </div>
          )}

          {order.status === "confirmed" && (
            <div className="mt-4">
              <Button onClick={openDispatchDialog} className="bg-purple-500 hover:bg-purple-600" disabled={isUpdating}>
                <Truck className="mr-2 h-4 w-4" />
                Dispatch Order
              </Button>
            </div>
          )}
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
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Commission</span>
              <span>₹{order.commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Commission GST</span>
              <span>₹{order.commission_gst.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total Order Value</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600 font-bold">
              <span>Your Payout</span>
              <span>₹{order.wholesaler_payout.toFixed(2)}</span>
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

              {payment.payment_status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="font-medium text-yellow-700">Payment Pending</p>
                  <p className="text-sm text-yellow-600">
                    {payment.payment_method === "cod"
                      ? "Cash on delivery payment will be collected upon delivery."
                      : "Waiting for customer to complete UPI payment."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Payment information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Retailer Details */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Retailer Details</CardTitle>
        </CardHeader>
        <CardContent>
          {order.retailer ? (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Business Name:</span> {order.retailer.business_name}
              </p>
              <p>
                <span className="font-medium">Contact Person:</span> {order.retailer.name}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {order.retailer.phone_number}
              </p>
              {order.retailer.pin_code && (
                <p>
                  <span className="font-medium">PIN Code:</span> {order.retailer.pin_code}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Retailer information not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this order? This will indicate that you are ready to fulfill the order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdateStatus("confirmed")}
              className="bg-green-500 hover:bg-green-600"
            >
              Confirm Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleUpdateStatus("rejected")} className="bg-red-500 hover:bg-red-600">
              Reject Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispatch Dialog */}
      <AlertDialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dispatch Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dispatch this order? This will assign a delivery partner to deliver the order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdateStatus("dispatched")}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Dispatch Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
