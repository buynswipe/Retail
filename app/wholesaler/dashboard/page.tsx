"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { ShoppingBag, Clock, FileText, Package, CreditCard, ShoppingCart, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { getOrdersByWholesaler } from "@/lib/order-service"
import type { Order } from "@/lib/order-service"

function WholesalerDashboardContent() {
  const { t } = useTranslation()
  const [orderCount, setOrderCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState("orders")
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getOrdersByWholesaler(user.id)
      if (error) {
        console.error("Error loading orders:", error)
      } else if (data) {
        // Filter for pending orders
        const pending = data.filter((order) => order.status === "placed")
        setPendingOrders(pending)
        setOrderCount(pending.length)
      }
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Wholesaler Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <h3 className="text-3xl font-bold">{orderCount}</h3>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Catalog Items</p>
                <h3 className="text-3xl font-bold">42</h3>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
                <h3 className="text-3xl font-bold">₹24.5K</h3>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Retailers</p>
                <h3 className="text-3xl font-bold">18</h3>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button asChild className="h-24 flex flex-col bg-blue-500 hover:bg-blue-600">
          <Link href="/wholesaler/orders">
            <ShoppingBag className="h-8 w-8 mb-2" />
            <span>Manage Orders</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-orange-500 hover:bg-orange-600">
          <Link href="/wholesaler/products">
            <Package className="h-8 w-8 mb-2" />
            <span>Manage Products</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-green-500 hover:bg-green-600">
          <Link href="/wholesaler/payments">
            <CreditCard className="h-8 w-8 mb-2" />
            <span>Payments</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-purple-500 hover:bg-purple-600">
          <Link href="/chat">
            <FileText className="h-8 w-8 mb-2" />
            <span>Chat</span>
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="orders" className="text-lg py-3">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="catalog" className="text-lg py-3">
            <Package className="mr-2 h-5 w-5" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-lg py-3">
            <CreditCard className="mr-2 h-5 w-5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-lg py-3">
            <FileText className="mr-2 h-5 w-5" />
            Tax
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Pending Orders</CardTitle>
                <Button asChild variant="outline">
                  <Link href="/wholesaler/orders">View All Orders</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Loading pending orders...</p>
                </div>
              ) : pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-5 w-5 text-blue-500" />
                              <h3 className="text-lg font-semibold">{order.order_number}</h3>
                              <Badge className="bg-blue-500">New</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500">{formatDate(order.created_at)}</span>
                            </div>
                            <div className="mt-2">
                              <p className="font-medium">Retailer: {order.retailer_name}</p>
                            </div>
                          </div>

                          <div className="text-center md:text-right">
                            <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                            <p className="text-gray-500">{order.items?.length || 0} items</p>
                            <div className="flex gap-2 mt-2">
                              <Button asChild size="sm" variant="outline" className="whitespace-nowrap">
                                <Link href={`/wholesaler/orders?id=${order.id}`}>
                                  <ShoppingCart className="mr-1 h-4 w-4" />
                                  View Items
                                </Link>
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button asChild className="bg-blue-500 hover:bg-blue-600">
                              <Link href={`/wholesaler/orders?id=${order.id}`}>Manage Order</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No pending orders at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Product Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <Button asChild className="bg-blue-500 hover:bg-blue-600">
                  <Link href="/wholesaler/products">
                    <Package className="mr-2 h-5 w-5" />
                    Manage Products
                  </Link>
                </Button>
              </div>
              <div className="text-center text-gray-500">
                <p>Manage your product catalog to make them available to retailers.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Payment History</CardTitle>
                <Button asChild variant="outline">
                  <Link href="/wholesaler/payments">View All Payments</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <Button asChild className="bg-green-500 hover:bg-green-600">
                  <Link href="/wholesaler/payments">
                    <CreditCard className="mr-2 h-5 w-5" />
                    View Payments
                  </Link>
                </Button>
              </div>
              <div className="text-center text-gray-500">
                <p>Track your payments and earnings from all orders.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Tax Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
              <div className="p-8 text-center text-gray-500">
                <p>Your tax reports will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function WholesalerDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <WholesalerDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
