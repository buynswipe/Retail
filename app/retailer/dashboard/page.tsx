"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Search, MapPin, ShoppingBag, Clock, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Wholesaler {
  id: string
  name: string
  business_name: string
  distance: number
  pin_code: string
  rating: number
}

function RetailerDashboardContent() {
  const { t } = useTranslation()
  const [pinCode, setPinCode] = useState("")
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    // Mock data
    const mockWholesalers: Wholesaler[] = [
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

    const mockOrders = [
      {
        id: "ORD001",
        date: "2023-04-20",
        status: "delivered",
        total: 2450,
        items: 12,
      },
      {
        id: "ORD002",
        date: "2023-04-15",
        status: "dispatched",
        total: 1250,
        items: 5,
      },
    ]

    setWholesalers(mockWholesalers)
    setRecentOrders(mockOrders)
  }, [])

  const handleSearch = () => {
    // In a real app, this would filter wholesalers by pin code
    console.log("Searching for wholesalers in pin code:", pinCode)
  }

  const handleUseGPS = () => {
    // In a real app, this would use the browser's geolocation API
    console.log("Using GPS to find nearby wholesalers")
  }

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Retailer Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
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
                  <Button className="h-14 px-6 bg-blue-500 hover:bg-blue-600">View Catalog</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
      <div className="space-y-4 mb-8">
        {recentOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">{order.id}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">{order.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">₹{order.total}</p>
                  <p className="text-gray-500">{order.items} items</p>
                </div>
                <div>
                  <Badge
                    className={
                      order.status === "delivered"
                        ? "bg-green-500"
                        : order.status === "dispatched"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                    }
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="text-sm whitespace-nowrap">
                      <FileText className="mr-1 h-4 w-4" />
                      Invoice
                    </Button>
                  </div>
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
