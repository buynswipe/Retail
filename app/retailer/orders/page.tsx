"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { ShoppingBag, Clock, FileText, Eye, Search, X, Truck, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { getOrdersByRetailer, getOrderById } from "@/lib/order-service"
import type { Order, OrderItem } from "@/lib/order-service"
import { getDeliveryAssignmentByOrderId } from "@/lib/delivery-service"
import type { DeliveryAssignment } from "@/lib/delivery-service"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function OrdersContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAssignment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getOrdersByRetailer(user.id)
      if (error) {
        throw error
      }
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOrder = async (orderId: string) => {
    try {
      const { data: orderData, error: orderError } = await getOrderById(orderId)
      if (orderError) {
        throw orderError
      }
      setSelectedOrder(orderData)

      // If order is dispatched or delivered, get delivery information
      if (orderData?.status === "dispatched" || orderData?.status === "delivered") {
        const { data: deliveryData, error: deliveryError } = await getDeliveryAssignmentByOrderId(orderId)
        if (!deliveryError) {
          setSelectedDelivery(deliveryData)
        }
      } else {
        setSelectedDelivery(null)
      }

      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error loading order details:", error)
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-blue-500"
      case "confirmed":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "dispatched":
        return "bg-orange-500"
      case "delivered":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.wholesaler_name && order.wholesaler_name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by order number or wholesaler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
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
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 min-w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "No orders match your search criteria"
              : "You haven't placed any orders yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">{order.order_number}</h3>
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium">Wholesaler: {order.wholesaler_name}</p>
                      <Badge className={getPaymentStatusBadgeColor(order.payment_status)}>
                        Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-gray-500">{order.items?.length || 0} items</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View Details
                      </Button>
                      {order.status === "delivered" && (
                        <Button size="sm" variant="outline" className="whitespace-nowrap">
                          <FileText className="mr-1 h-4 w-4" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.order_number} - {formatDate(selectedOrder?.created_at || "")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <Badge className={getStatusBadgeColor(selectedOrder.status)}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Badge>
                    </p>
                    <p>
                      <span className="text-gray-500">Payment Method:</span>{" "}
                      {selectedOrder.payment_method.toUpperCase()}
                    </p>
                    <p>
                      <span className="text-gray-500">Payment Status:</span>{" "}
                      <Badge className={getPaymentStatusBadgeColor(selectedOrder.payment_status)}>
                        {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Wholesaler Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Name:</span> {selectedOrder.wholesaler_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {selectedDelivery && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-blue-500" />
                    Delivery Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <Badge
                        className={
                          selectedDelivery.status === "completed"
                            ? "bg-green-500"
                            : selectedDelivery.status === "accepted"
                              ? "bg-orange-500"
                              : "bg-blue-500"
                        }
                      >
                        {selectedDelivery.status.charAt(0).toUpperCase() + selectedDelivery.status.slice(1)}
                      </Badge>
                    </p>
                    {selectedDelivery.delivery_partner_name && (
                      <>
                        <p>
                          <span className="text-gray-500">Delivery Partner:</span>{" "}
                          {selectedDelivery.delivery_partner_name}
                        </p>
                        {selectedDelivery.delivery_partner_phone && (
                          <p>
                            <span className="text-gray-500">Contact:</span>{" "}
                            <a
                              href={`tel:${selectedDelivery.delivery_partner_phone}`}
                              className="text-blue-500 flex items-center inline-flex"
                            >
                              {selectedDelivery.delivery_partner_phone} <Phone className="h-3 w-3 ml-1" />
                            </a>
                          </p>
                        )}
                      </>
                    )}
                    {selectedDelivery.status === "accepted" && selectedDelivery.otp && (
                      <p>
                        <span className="text-gray-500">Verification OTP:</span>{" "}
                        <span className="font-bold">{selectedDelivery.otp}</span>{" "}
                        <span className="text-xs text-gray-500">(Share with delivery partner upon delivery)</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item: OrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || "Product"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.total_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Delivery Fee</span>
                  <span>₹{selectedOrder.delivery_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg mt-2">
                  <span>Total</span>
                  <span>₹{(selectedOrder.total_amount + selectedOrder.delivery_charge).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <OrdersContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
