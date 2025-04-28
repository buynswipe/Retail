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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getWholesalerOrders, getOrderStatistics } from "@/lib/order-service"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  X,
  IndianRupee,
  Calendar,
  User,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

export default function WholesalerOrdersContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [statistics, setStatistics] = useState<any>(null)

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const [ordersResult, statsResult] = await Promise.all([
          getWholesalerOrders(user.id),
          getOrderStatistics(user.id, "wholesaler"),
        ])

        if (ordersResult.error) throw ordersResult.error
        if (statsResult.error) throw statsResult.error

        setOrders(ordersResult.data || [])
        setFilteredOrders(ordersResult.data || [])
        setStatistics(statsResult.data)
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

    if (user) {
      loadOrders()
    }
  }, [user])

  useEffect(() => {
    // Filter and sort orders
    let result = [...orders]

    // Apply status filter
    if (activeTab !== "all") {
      result = result.filter((order) => order.status === activeTab)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.retailer?.business_name?.toLowerCase().includes(query) ||
          order.retailer?.name?.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-high-low":
          return b.total_amount - a.total_amount
        case "price-low-high":
          return a.total_amount - b.total_amount
        default:
          return 0
      }
    })

    setFilteredOrders(result)
  }, [orders, activeTab, searchQuery, sortBy])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "processing":
        return <Package className="h-5 w-5 text-purple-500" />
      case "shipped":
        return <Truck className="h-5 w-5 text-indigo-500" />
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "returned":
        return <RotateCcw className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">{t("Manage Orders")}</h1>

          {/* Order Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("Total Orders")}</p>
                      <h3 className="text-3xl font-bold">{statistics.totalOrders}</h3>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("Pending Orders")}</p>
                      <h3 className="text-3xl font-bold">{statistics.ordersByStatus.pending || 0}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("Completed Orders")}</p>
                      <h3 className="text-3xl font-bold">{statistics.ordersByStatus.delivered || 0}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("Total Revenue")}</p>
                      <h3 className="text-3xl font-bold">₹{statistics.totalAmount.toLocaleString()}</h3>
                    </div>
                    <IndianRupee className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid grid-cols-4 md:grid-cols-7">
                <TabsTrigger value="all">{t("All")}</TabsTrigger>
                <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
                <TabsTrigger value="confirmed">{t("Confirmed")}</TabsTrigger>
                <TabsTrigger value="processing">{t("Processing")}</TabsTrigger>
                <TabsTrigger value="shipped">{t("Shipped")}</TabsTrigger>
                <TabsTrigger value="delivered">{t("Delivered")}</TabsTrigger>
                <TabsTrigger value="cancelled">{t("Cancelled")}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("Search orders...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("Sort by")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("Newest First")}</SelectItem>
                  <SelectItem value="oldest">{t("Oldest First")}</SelectItem>
                  <SelectItem value="price-high-low">{t("Price: High to Low")}</SelectItem>
                  <SelectItem value="price-low-high">{t("Price: Low to High")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div>
                        <Skeleton className="h-10 w-28" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("No orders found")}</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || activeTab !== "all"
                  ? t("No orders match your search or filter criteria.")
                  : t("You haven't received any orders yet.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {t("Order")} #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{t(order.status)}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {order.retailer?.business_name || order.retailer?.name || t("Unknown Retailer")}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.retailer?.city}, {order.retailer?.state}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium mb-1">{t("Total Amount")}</div>
                          <div className="text-lg font-bold">{formatCurrency(order.total_amount)}</div>
                        </div>

                        <Button asChild>
                          <Link href={`/wholesaler/orders/${order.id}`}>{t("View Details")}</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="border-t bg-gray-50 p-4">
                      <div className="text-sm font-medium mb-2">{t("Items")}</div>
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                            <div className="h-8 w-8 bg-gray-100 rounded overflow-hidden">
                              {item.product?.image_url ? (
                                <Image
                                  src={item.product.image_url || "/placeholder.svg"}
                                  alt={item.product.name}
                                  width={32}
                                  height={32}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 m-2 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm">
                              {item.quantity} x {item.product?.name}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex items-center bg-white p-2 rounded border">
                            <span className="text-sm text-gray-500">
                              +{order.items.length - 3} {t("more items")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
