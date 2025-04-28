"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from "@/lib/utils"
import { getWholesalerOrders, updateOrderStatus } from "@/lib/order-service"
import type { Order } from "@/lib/types"
import {
  Search,
  Package,
  Store,
  Calendar,
  CreditCard,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function WholesalerOrdersPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await getWholesalerOrders(user.id)
        if (error) throw error

        setOrders(data || [])
        setFilteredOrders(data || [])
      } catch (error) {
        console.error("Failed to load orders:", error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [user])

  // Filter orders based on search query and status
  useEffect(() => {
    let filtered = [...orders]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          (order.retailer?.business_name && order.retailer.business_name.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, orders])

  const getOrderItemsSummary = (order: Order) => {
    if (!order.items || order.items.length === 0) return ""

    const itemCount = order.items.length
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

    if (itemCount === 1) {
      return `${totalQuantity} × ${order.items[0].product?.name}`
    }

    return `${totalQuantity} items from ${itemCount} products`
  }

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus || !user) return

    setIsUpdating(true)
    try {
      const { success, error } = await updateOrderStatus(selectedOrder.id, newStatus, user.id, "wholesaler")

      if (!success) throw error

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === selectedOrder.id ? { ...order, status: newStatus } : order)),
      )

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })

      setIsStatusDialogOpen(false)
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order)

    // Set initial status based on current status
    let initialStatus = ""
    switch (order.status) {
      case "pending":
        initialStatus = "confirmed"
        break
      case "confirmed":
        initialStatus = "processing"
        break
      case "processing":
        initialStatus = "shipped"
        break
      default:
        initialStatus = order.status
    }

    setNewStatus(initialStatus)
    setIsStatusDialogOpen(true)
  }

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return [
          { value: "confirmed", label: "Confirm Order", icon: <CheckCircle className="h-4 w-4 mr-2" /> },
          { value: "cancelled", label: "Cancel Order", icon: <XCircle className="h-4 w-4 mr-2" /> },
        ]
      case "confirmed":
        return [
          { value: "processing", label: "Start Processing", icon: <Package className="h-4 w-4 mr-2" /> },
          { value: "cancelled", label: "Cancel Order", icon: <XCircle className="h-4 w-4 mr-2" /> },
        ]
      case "processing":
        return [
          { value: "shipped", label: "Mark as Shipped", icon: <Truck className="h-4 w-4 mr-2" /> },
          { value: "cancelled", label: "Cancel Order", icon: <XCircle className="h-4 w-4 mr-2" /> },
        ]
      case "shipped":
        return [{ value: "delivered", label: "Mark as Delivered", icon: <CheckCircle className="h-4 w-4 mr-2" /> }]
      default:
        return []
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t("Manage Orders")}</h1>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={t("Search orders...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="overflow-x-auto">
              <TabsList className="h-auto p-1">
                <TabsTrigger value="all" className="px-3 py-1.5">
                  {t("All Orders")}
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-3 py-1.5">
                  {t("Pending")}
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="px-3 py-1.5">
                  {t("Confirmed")}
                </TabsTrigger>
                <TabsTrigger value="processing" className="px-3 py-1.5">
                  {t("Processing")}
                </TabsTrigger>
                <TabsTrigger value="shipped" className="px-3 py-1.5">
                  {t("Shipped")}
                </TabsTrigger>
                <TabsTrigger value="delivered" className="px-3 py-1.5">
                  {t("Delivered")}
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="px-3 py-1.5">
                  {t("Cancelled")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">{t("Loading orders...")}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery || statusFilter !== "all"
                  ? t("No orders match your search")
                  : t("You don't have any orders yet")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Order Status */}
                      <div
                        className="w-full md:w-2 flex-shrink-0"
                        style={{
                          backgroundColor:
                            order.status === "cancelled"
                              ? "#ef4444"
                              : order.status === "delivered"
                                ? "#10b981"
                                : order.status === "shipped"
                                  ? "#6366f1"
                                  : order.status === "processing"
                                    ? "#8b5cf6"
                                    : order.status === "confirmed"
                                      ? "#3b82f6"
                                      : "#f59e0b",
                        }}
                      ></div>

                      {/* Order Content */}
                      <div className="p-6 flex-1">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="font-medium flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              {t("Order")} #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="mt-2 md:mt-0 flex flex-col md:items-end gap-2">
                            <Badge className={getOrderStatusColor(order.status)}>
                              {t(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.payment_status)}>
                              {t(order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1))}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Retailer */}
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                              {order.retailer?.profile_image ? (
                                <Image
                                  src={order.retailer.profile_image || "/placeholder.svg"}
                                  alt={order.retailer.business_name || order.retailer.name}
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
                              <p className="text-sm text-gray-500">{t("Retailer")}</p>
                              <p className="font-medium">{order.retailer?.business_name || order.retailer?.name}</p>
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <p className="text-sm text-gray-500">{t("Items")}</p>
                            <p className="font-medium">{getOrderItemsSummary(order)}</p>
                          </div>

                          {/* Total */}
                          <div className="md:text-right">
                            <p className="text-sm text-gray-500">{t("Total Amount")}</p>
                            <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-4">
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {order.expected_delivery_date
                                ? formatDate(order.expected_delivery_date)
                                : t("Delivery date not set")}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <CreditCard className="h-4 w-4 mr-1" />
                              {order.payment_status === "pending" ? t("Cash on Delivery") : t("Online Payment")}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {/* Status Update Button */}
                            {["pending", "confirmed", "processing", "shipped"].includes(order.status) && (
                              <Button variant="outline" onClick={() => openStatusDialog(order)}>
                                {order.status === "pending" ? (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                ) : order.status === "confirmed" ? (
                                  <Package className="mr-2 h-4 w-4" />
                                ) : order.status === "processing" ? (
                                  <Truck className="mr-2 h-4 w-4" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                {order.status === "pending"
                                  ? t("Confirm Order")
                                  : order.status === "confirmed"
                                    ? t("Start Processing")
                                    : order.status === "processing"
                                      ? t("Ship Order")
                                      : t("Mark Delivered")}
                              </Button>
                            )}

                            {/* View Details Button */}
                            <Button asChild>
                              <Link href={`/wholesaler/orders/${order.id}`}>
                                {t("View Details")}
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Status Update Dialog */}
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("Update Order Status")}</DialogTitle>
                <DialogDescription>
                  {t("Order")} #{selectedOrder?.id.slice(0, 8).toUpperCase()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-500">
                  {t("Current status")}:{" "}
                  <Badge className={getOrderStatusColor(selectedOrder?.status || "pending")}>
                    {selectedOrder?.status}
                  </Badge>
                </p>

                <div className="space-y-2">
                  <p className="font-medium">{t("Select new status")}:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedOrder &&
                      getAvailableStatuses(selectedOrder.status).map((status) => (
                        <Button
                          key={status.value}
                          variant={newStatus === status.value ? "default" : "outline"}
                          className={`justify-start ${
                            status.value === "cancelled" ? "border-red-200 text-red-600 hover:bg-red-50" : ""
                          }`}
                          onClick={() => setNewStatus(status.value)}
                        >
                          {status.icon}
                          {status.label}
                        </Button>
                      ))}
                  </div>
                </div>

                {newStatus === "cancelled" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-600">{t("Warning")}</p>
                        <p className="text-sm text-red-600">
                          {t("Cancelling this order cannot be undone. The inventory will be returned to stock.")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={isUpdating || !newStatus}
                  variant={newStatus === "cancelled" ? "destructive" : "default"}
                >
                  {isUpdating ? t("Updating...") : t("Update Status")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
