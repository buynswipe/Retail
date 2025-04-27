"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Search, MapPin, ShoppingBag, Clock, FileText, ShoppingCart, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { getOrdersByRetailer } from "@/lib/order-service"
import type { Order } from "@/lib/order-service"

function RetailerDashboardContent() {
  const { t } = useTranslation()
  const [pinCode, setPinCode] = useState("")
  const [wholesalers, setWholesalers] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const router = useRouter()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (user) {
      setPinCode(user.pinCode || "")
      loadRecentOrders()
    }
  }, [user])

  const loadRecentOrders = async () => {
    if (!user) return

    setIsLoading(true)
    setLoadError(null)

    try {
      console.log("Loading orders for user:", user.id)
      const { data, error } = await getOrdersByRetailer(user.id)

      if (error) {
        console.error("Error loading orders:", error)
        setLoadError(`Failed to load orders: ${error.message || "Unknown error"}`)
      } else if (data) {
        console.log("Orders loaded:", data.length)
        // Get the 3 most recent orders
        setRecentOrders(data.slice(0, 3))
      } else {
        console.log("No orders found")
        setRecentOrders([])
      }
    } catch (error: any) {
      console.error("Exception loading orders:", error)
      setLoadError(`Error: ${error?.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Mock data
    const mockWholesalers = [
      {
        id: "1",
        name: "Vikram Singh",
        business_name: "Vikram Wholesale",
        distance: 2.3,
        pin_code: "400001",
        rating: 4.8,
      },
      {
        id: "2",
        name: "Sunil Kapoor",
        business_name: "Kapoor Distributors",
        distance: 3.7,
        pin_code: "400001",
        rating: 4.5,
      },
      {
        id: "3",
        name: "Amit Patel",
        business_name: "Patel Supplies",
        distance: 5.1,
        pin_code: "400002",
        rating: 4.2,
      },
    ]

    setWholesalers(mockWholesalers)
  }, [])

  const handleSearch = () => {
    // In a real app, this would filter wholesalers by pin code
    console.log("Searching for wholesalers in pin code:", pinCode)
  }

  const handleUseGPS = () => {
    // In a real app, this would use the browser's geolocation API
    console.log("Using GPS to find nearby wholesalers")
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

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Retailer Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button asChild className="h-24 flex flex-col bg-blue-500 hover:bg-blue-600">
          <Link href="/retailer/browse">
            <ShoppingCart className="h-8 w-8 mb-2" />
            <span>Browse Products</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-green-500 hover:bg-green-600">
          <Link href="/retailer/orders">
            <ShoppingBag className="h-8 w-8 mb-2" />
            <span>My Orders</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-orange-500 hover:bg-orange-600">
          <Link href="/retailer/payments">
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

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find Wholesalers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter pin code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="pl-10 h-12 text-lg w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="h-12 bg-blue-500 hover:bg-blue-600 whitespace-nowrap">
                Search
              </Button>
              <Button variant="outline" onClick={handleUseGPS} className="h-12 whitespace-nowrap">
                <MapPin className="mr-2 h-5 w-5" />
                Use GPS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recent Orders</h2>
        <Button asChild variant="outline">
          <Link href="/retailer/orders">View All</Link>
        </Button>
      </div>
      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Loading recent orders...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-6">
            <p className="text-red-500">{loadError}</p>
            <Button onClick={loadRecentOrders} className="mt-4">
              Retry
            </Button>
          </div>
        ) : recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
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
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-gray-500">{order.items?.length || 0} items</p>
                  </div>
                  <div>
                    <Button asChild variant="outline" size="sm" className="text-sm whitespace-nowrap">
                      <Link href={`/retailer/orders?id=${order.id}`}>
                        <FileText className="mr-1 h-4 w-4" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No recent orders. Start shopping to see your orders here.</p>
            <Button asChild className="mt-4 bg-blue-500 hover:bg-blue-600">
              <Link href="/retailer/browse">Browse Products</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Wholesalers List */}
      <h2 className="text-2xl font-bold mb-4">Nearby Wholesalers</h2>
      <div className="space-y-4 mb-8">
        {wholesalers.map((wholesaler) => (
          <Card key={wholesaler.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={`/abstract-geometric-shapes.png?height=64&width=64&query=${wholesaler.business_name}`}
                        alt={wholesaler.business_name}
                      />
                      <AvatarFallback>{wholesaler.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{wholesaler.business_name}</h3>
                      <p className="text-gray-500">{wholesaler.name}</p>
                      <div className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-gray-500 mr-4">{wholesaler.distance} km away</span>
                        <Badge variant="outline">Pin: {wholesaler.pin_code}</Badge>
                      </div>
                      <div className="mt-2">
                        <Badge className="bg-yellow-500">{wholesaler.rating} ★</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 flex items-center justify-center">
                  <Button asChild className="h-14 px-6 bg-blue-500 hover:bg-blue-600">
                    <Link href={`/retailer/browse?wholesaler=${wholesaler.id}`}>View Catalog</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function RetailerDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <RetailerDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
