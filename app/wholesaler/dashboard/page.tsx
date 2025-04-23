"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { ShoppingBag, Clock, Plus, FileText, Package, CreditCard, ShoppingCart, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

function WholesalerDashboardContent() {
  const { t } = useTranslation()
  const [orderCount, setOrderCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("orders")
  const router = useRouter()

  useEffect(() => {
    // Mock data
    const mockOrders = [
      {
        id: "ORD003",
        date: "2023-04-22",
        status: "placed",
        total: 3250,
        items: 15,
        retailer: {
          name: "Raj Kumar",
          business: "Raj Grocery Store",
        },
      },
      {
        id: "ORD004",
        date: "2023-04-21",
        status: "placed",
        total: 1750,
        items: 8,
        retailer: {
          name: "Ajay Sharma",
          business: "Ajay General Store",
        },
      },
    ]

    setPendingOrders(mockOrders)
    setOrderCount(mockOrders.length)
  }, [])

  const handleLogout = () => {
    router.push("/login")
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

      {/* Add Product Button */}
      <div className="flex justify-end mb-6">
        <Button className="h-12 bg-blue-500 hover:bg-blue-600">
          <Plus className="mr-2 h-5 w-5" />
          Add Product
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
              <CardTitle className="text-2xl">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-5 w-5 text-blue-500" />
                              <h3 className="text-lg font-semibold">{order.id}</h3>
                              <Badge className="bg-blue-500">New</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-500">{order.date}</span>
                            </div>
                            <div className="mt-2">
                              <p className="font-medium">{order.retailer.business}</p>
                              <p className="text-gray-500">{order.retailer.name}</p>
                            </div>
                          </div>

                          <div className="text-center md:text-right">
                            <p className="text-lg font-semibold">₹{order.total}</p>
                            <p className="text-gray-500">{order.items} items</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" className="whitespace-nowrap">
                                <ShoppingCart className="mr-1 h-4 w-4" />
                                View Items
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button className="bg-blue-500 hover:bg-blue-600">Accept Order</Button>
                            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
                              Reject Order
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
              <div className="p-8 text-center text-gray-500">
                <p>Your product catalog will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-gray-500">
                <p>Your payment history will appear here.</p>
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
