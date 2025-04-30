"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { Package, Calendar, ChevronRight, Loader2 } from "lucide-react"
import type { Order } from "@/lib/types"

// Store demo orders in localStorage to persist status changes
const getDemoOrders = (userId: string) => {
  try {
    const storedOrders = localStorage.getItem(`demo_orders_${userId}`)
    if (storedOrders) {
      return JSON.parse(storedOrders)
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error)
  }

  // Default demo orders if none in localStorage
  return [
    {
      id: "demo-order-1",
      order_number: "ORD12345678",
      retailer_id: "demo-retailer-1",
      wholesaler_id: userId,
      total_amount: 2500,
      wholesaler_payout: 2400,
      status: "placed",
      payment_method: "online",
      payment_status: "pending",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      retailer: {
        id: "demo-retailer-1",
        business_name: "Demo Retail Store",
        name: "Demo Retailer",
      },
    },
    {
      id: "demo-order-2",
      order_number: "ORD87654321",
      retailer_id: "demo-retailer-2",
      wholesaler_id: userId,
      total_amount: 3500,
      wholesaler_payout: 3350,
      status: "confirmed",
      payment_method: "cod",
      payment_status: "pending",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      retailer: {
        id: "demo-retailer-2",
        business_name: "Another Retail Shop",
        name: "Another Retailer",
      },
    },
  ]
}

// Save demo orders to localStorage
const saveDemoOrders = (userId: string, orders: Order[]) => {
  try {
    localStorage.setItem(`demo_orders_${userId}`, JSON.stringify(orders))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Track if we've already processed the URL params
  const [processedParams, setProcessedParams] = useState(false)

  // Load orders on initial mount and when user changes
  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  // Process URL params only once
  useEffect(() => {
    const updatedOrderId = searchParams.get("updatedOrderId")
    const newStatus = searchParams.get("newStatus")

    if (updatedOrderId && newStatus && user && !processedParams) {
      // Update the order in our local state
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) => {
          if (order.id === updatedOrderId) {
            return { ...order, status: newStatus }
          }
          return order
        })

        // If this is a demo user, save the updated orders
        if (user.id.startsWith("user-")) {
          saveDemoOrders(user.id, updatedOrders)
        }

        return updatedOrders
      })

      // Mark as processed to prevent infinite loop
      setProcessedParams(true)
    }
  }, [searchParams, user, processedParams])

  // Add a new effect to reload orders when the component is focused
  useEffect(() => {
    // This will run when the component mounts and becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadOrders()
      }
    }

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Check if this is a demo user ID
      if (user.id.startsWith("user-")) {
        // Use demo data for demo users from localStorage
        const demoOrders = getDemoOrders(user.id)
        setOrders(demoOrders)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          retailer:retailer_id(id, business_name, name)
        `)
        .eq("wholesaler_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading orders:", error)
        toast({
          title: "Error",
          description: "Using demo orders instead of database data.",
          variant: "destructive",
        })
        // Fall back to demo data
        const demoOrders = getDemoOrders(user.id)
        setOrders(demoOrders)
      } else {
        setOrders(data || [])
      }
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

  const handleViewOrder = (orderId: string) => {
    router.push(`/wholesaler/orders/${orderId}`)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Removed loadOrders() call to prevent unnecessary data fetching
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
    })
  }

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  return (
    <div className="container mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="placed">New Orders</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span>Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Orders Found</h2>
                <p className="text-gray-500 mb-6">
                  {activeTab === "all" ? "You don't have any orders yet." : `You don't have any ${activeTab} orders.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewOrder(order.id)}
                >
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                          <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                          <p className="text-gray-500 text-sm flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <Badge className={`${getPaymentStatusColor(order.payment_status)} text-white`}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <p className="font-medium">
                          Retailer: {order.retailer?.business_name || order.retailer?.name || "Unknown Retailer"}
                        </p>
                        <p className="text-gray-500">Payment Method: {order.payment_method.toUpperCase()}</p>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center">
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-green-600">Your Payout: ₹{order.wholesaler_payout.toFixed(2)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
