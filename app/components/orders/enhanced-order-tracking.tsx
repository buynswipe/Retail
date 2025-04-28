"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Phone,
  Calendar,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { updateOrderStatus } from "@/lib/order-service"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnhancedOrderTrackingProps {
  order: any
  onStatusUpdate?: () => void
}

export function EnhancedOrderTracking({ order, onStatusUpdate }: EnhancedOrderTrackingProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [updateReason, setUpdateReason] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | null>(null)

  useEffect(() => {
    // Calculate estimated delivery date based on order status and creation date
    if (order) {
      const orderDate = new Date(order.created_at)
      let daysToAdd = 3 // Default for pending

      switch (order.status) {
        case "confirmed":
          daysToAdd = 3
          break
        case "processing":
          daysToAdd = 2
          break
        case "shipped":
          daysToAdd = 1
          break
        case "delivered":
        case "cancelled":
        case "returned":
          daysToAdd = 0
          break
      }

      if (order.expected_delivery_date) {
        setEstimatedDelivery(new Date(order.expected_delivery_date))
      } else {
        const estimatedDate = new Date(orderDate)
        estimatedDate.setDate(orderDate.getDate() + daysToAdd)
        setEstimatedDelivery(estimatedDate)
      }
    }
  }, [order])

  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 0
      case "confirmed":
        return 1
      case "processing":
        return 2
      case "shipped":
        return 3
      case "delivered":
        return 4
      case "cancelled":
        return -1
      case "returned":
        return 5
      default:
        return 0
    }
  }

  const currentStep = getStatusStep(order?.status || "pending")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-amber-500" />
      case "confirmed":
        return <CheckCircle className="h-6 w-6 text-blue-500" />
      case "processing":
        return <Package className="h-6 w-6 text-purple-500" />
      case "shipped":
        return <Truck className="h-6 w-6 text-indigo-500" />
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "cancelled":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case "returned":
        return <RotateCcw className="h-6 w-6 text-orange-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "returned":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getNextPossibleStatuses = () => {
    if (!order || !user) return []

    const isRetailer = user.role === "retailer"
    const isWholesaler = user.role === "wholesaler"

    switch (order.status) {
      case "pending":
        return isWholesaler ? ["confirmed", "cancelled"] : ["cancelled"]
      case "confirmed":
        return isWholesaler ? ["processing", "cancelled"] : ["cancelled"]
      case "processing":
        return isWholesaler ? ["shipped", "cancelled"] : ["cancelled"]
      case "shipped":
        return isWholesaler ? ["delivered"] : []
      case "delivered":
        return isRetailer ? ["returned"] : []
      default:
        return []
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || !user || !newStatus) return

    setIsUpdating(true)
    try {
      const { success, error } = await updateOrderStatus(order.id, newStatus, user.id, user.role, updateReason)

      if (!success) {
        throw new Error(error || "Failed to update order status")
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })

      if (onStatusUpdate) {
        onStatusUpdate()
      }
      setShowUpdateDialog(false)
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openUpdateDialog = (status: string) => {
    setNewStatus(status)
    setUpdateReason("")
    setShowUpdateDialog(true)
  }

  if (!order) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              {t("Order Tracking")}
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{t(order.status)}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("Order Date")}</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("Delivery Address")}</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("Contact")}</p>
                <p className="font-medium">{order.delivery_contact}</p>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          {currentStep >= 0 && (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Pending */}
              <div className="flex mb-6 relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                    currentStep >= 0 ? "bg-amber-500 text-white" : "bg-gray-200"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{t("Order Placed")}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.created_at)} • {t("Waiting for confirmation")}
                  </p>
                </div>
              </div>

              {/* Confirmed */}
              <div className="flex mb-6 relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                    currentStep >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{t("Order Confirmed")}</h3>
                  <p className="text-sm text-gray-500">
                    {currentStep >= 1
                      ? `${formatDate(order.updated_at)} • ${t("Wholesaler confirmed your order")}`
                      : t("Waiting for wholesaler confirmation")}
                  </p>
                </div>
              </div>

              {/* Processing */}
              <div className="flex mb-6 relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                    currentStep >= 2 ? "bg-purple-500 text-white" : "bg-gray-200"
                  }`}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{t("Processing")}</h3>
                  <p className="text-sm text-gray-500">
                    {currentStep >= 2
                      ? `${formatDate(order.updated_at)} • ${t("Your order is being prepared")}`
                      : t("Waiting for order processing")}
                  </p>
                </div>
              </div>

              {/* Shipped */}
              <div className="flex mb-6 relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                    currentStep >= 3 ? "bg-indigo-500 text-white" : "bg-gray-200"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{t("Shipped")}</h3>
                  <p className="text-sm text-gray-500">
                    {currentStep >= 3
                      ? `${formatDate(order.updated_at)} • ${t("Your order is on the way")}`
                      : t("Waiting for shipment")}
                  </p>
                </div>
              </div>

              {/* Delivered */}
              <div className="flex relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                    currentStep >= 4 ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">{t("Delivered")}</h3>
                  <p className="text-sm text-gray-500">
                    {currentStep >= 4
                      ? `${formatDate(order.updated_at)} • ${t("Your order has been delivered")}`
                      : estimatedDelivery
                        ? `${t("Estimated delivery")}: ${formatDate(estimatedDelivery)}`
                        : t("Waiting for delivery")}
                  </p>
                </div>
              </div>

              {/* Returned (conditional) */}
              {currentStep === 5 && (
                <div className="flex mt-6 relative">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center z-10 bg-orange-500 text-white">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">{t("Returned")}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.updated_at)} • {t("Order has been returned")}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancelled (conditional) */}
              {currentStep === -1 && (
                <div className="flex mt-6 relative">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center z-10 bg-red-500 text-white">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">{t("Cancelled")}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.updated_at)} • {t("Order has been cancelled")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {getNextPossibleStatuses().length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex flex-wrap gap-3">
                {getNextPossibleStatuses().map((status) => (
                  <Button
                    key={status}
                    variant={status === "cancelled" || status === "returned" ? "outline" : "default"}
                    className={
                      status === "cancelled"
                        ? "border-red-200 text-red-700 hover:bg-red-50"
                        : status === "returned"
                          ? "border-orange-200 text-orange-700 hover:bg-orange-50"
                          : ""
                    }
                    onClick={() => openUpdateDialog(status)}
                  >
                    {status === "cancelled" ? (
                      <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    ) : status === "returned" ? (
                      <RotateCcw className="mr-2 h-4 w-4 text-orange-500" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {t(`Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Update Order Status to")} {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "cancelled"
                ? t("This action cannot be undone. The order will be cancelled.")
                : newStatus === "returned"
                  ? t("This action cannot be undone. The order will be marked as returned.")
                  : t("Update the status of this order to reflect its current state.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t("Reason (optional)")}</Label>
              <Textarea
                id="reason"
                placeholder={t("Provide a reason for this status update...")}
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
              />
            </div>

            {newStatus === "shipped" && (
              <div className="space-y-2">
                <Label htmlFor="shipping-method">{t("Shipping Method")}</Label>
                <Select defaultValue="standard">
                  <SelectTrigger id="shipping-method">
                    <SelectValue placeholder={t("Select shipping method")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t("Standard Delivery")}</SelectItem>
                    <SelectItem value="express">{t("Express Delivery")}</SelectItem>
                    <SelectItem value="same-day">{t("Same Day Delivery")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              variant={newStatus === "cancelled" || newStatus === "returned" ? "destructive" : "default"}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Updating...")}
                </>
              ) : (
                t("Confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
