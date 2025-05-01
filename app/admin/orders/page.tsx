"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Download, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/app/components/navbar"
import ProtectedRoute from "@/app/components/protected-route"
import { errorHandler } from "@/lib/error-handler"
import { getAllOrders } from "@/lib/order-service"
import type { Order } from "@/lib/types"

export default function AdminOrders() {
  // State management
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { toast } = useToast()

  // Load orders on component mount
  useEffect(() => {
    loadOrders()
  }, [])

  // Filter orders when search term or status filter changes
  useEffect(() => {
    filterOrders()
  }, [searchTerm, statusFilter, orders])

  // Load orders from the database
  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getAllOrders()

      if (error) {
        throw error
      }

      setOrders(data || [])
    } catch (error) {
      errorHandler(error, "Failed to load orders")
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter orders based on search term and status filter
  const filterOrders = () => {
    let filtered = [...orders]

    // Filter by status if not "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(term) ||
          order.retailer_id.toLowerCase().includes(term) ||
          order.wholesaler_id.toLowerCase().includes(term),
      )
    }

    setFilteredOrders(filtered)
  }

  // View order details
  const viewOrderDetails = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  // Render order status badge
  const renderStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      placed: "bg-blue-100 text-blue-800 border-blue-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      dispatched: "bg-yellow-100 text-yellow-800 border-yellow-200",
      delivered: "bg-purple-100 text-purple-800 border-purple-200",
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Order Management</h1>
              <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search orders..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
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

                    <Button variant="outline" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              Loading orders...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No orders found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                            <TableCell>{renderStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.payment_status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order.id)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
