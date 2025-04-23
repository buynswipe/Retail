"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30days")
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersPerDay: [],
  })
  const [userStats, setUserStats] = useState({
    newUsers: 0,
    activeUsers: 0,
    usersByRole: {
      retailer: 0,
      wholesaler: 0,
      delivery: 0,
    },
  })
  const [topWholesalers, setTopWholesalers] = useState([])
  const [topRetailers, setTopRetailers] = useState([])

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/unauthorized")
      return
    }

    fetchAnalyticsData()
  }, [user, router, timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30days":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90days":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // Fetch orders data
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
    } else {
      // Calculate order statistics
      const totalOrders = ordersData.length
      const totalRevenue = ordersData.reduce((sum, order) => sum + order.total_amount, 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Group orders by day
      const ordersByDay = {}
      ordersData.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!ordersByDay[date]) {
          ordersByDay[date] = 0
        }
        ordersByDay[date]++
      })

      const ordersPerDay = Object.entries(ordersByDay).map(([date, count]) => ({
        date,
        count,
      }))

      setOrderStats({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersPerDay,
      })
    }

    // Fetch users data
    const { data: usersData, error: usersError } = await supabase.from("users").select("*")

    if (usersError) {
      console.error("Error fetching users:", usersError)
    } else {
      // Calculate user statistics
      const newUsers = usersData.filter(
        (user) => new Date(user.created_at) >= startDate && new Date(user.created_at) <= endDate,
      ).length

      const usersByRole = {
        retailer: usersData.filter((user) => user.role === "retailer").length,
        wholesaler: usersData.filter((user) => user.role === "wholesaler").length,
        delivery: usersData.filter((user) => user.role === "delivery").length,
      }

      setUserStats({
        newUsers,
        activeUsers: usersData.length,
        usersByRole,
      })
    }

    // Fetch top wholesalers
    const { data: topWholesalersData, error: topWholesalersError } = await supabase.rpc("get_top_wholesalers", {
      start_date: startDateStr,
      end_date: endDateStr,
      limit_count: 5,
    })

    if (topWholesalersError) {
      console.error("Error fetching top wholesalers:", topWholesalersError)
    } else {
      setTopWholesalers(topWholesalersData || [])
    }

    // Fetch top retailers
    const { data: topRetailersData, error: topRetailersError } = await supabase.rpc("get_top_retailers", {
      start_date: startDateStr,
      end_date: endDateStr,
      limit_count: 5,
    })

    if (topRetailersError) {
      console.error("Error fetching top retailers:", topRetailersError)
    } else {
      setTopRetailers(topRetailersData || [])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        <div className="mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.newUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
              <CardDescription>Daily order volume for the selected time period.</CardDescription>
            </CardHeader>
            <CardContent>
              {orderStats.ordersPerDay.length === 0 ? (
                <p className="text-center py-4">No order data available for the selected period</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderStats.ordersPerDay.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell className="text-right">{day.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown of users by role.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retailers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.usersByRole.retailer}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Wholesalers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.usersByRole.wholesaler}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Delivery Partners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.usersByRole.delivery}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-performers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Wholesalers</CardTitle>
                <CardDescription>Wholesalers with the highest sales volume.</CardDescription>
              </CardHeader>
              <CardContent>
                {topWholesalers.length === 0 ? (
                  <p className="text-center py-4">No data available for the selected period</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topWholesalers.map((wholesaler) => (
                        <TableRow key={wholesaler.id}>
                          <TableCell>{wholesaler.business_name || "N/A"}</TableCell>
                          <TableCell className="text-right">{wholesaler.order_count}</TableCell>
                          <TableCell className="text-right">₹{wholesaler.total_revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Retailers</CardTitle>
                <CardDescription>Retailers with the highest purchase volume.</CardDescription>
              </CardHeader>
              <CardContent>
                {topRetailers.length === 0 ? (
                  <p className="text-center py-4">No data available for the selected period</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRetailers.map((retailer) => (
                        <TableRow key={retailer.id}>
                          <TableCell>{retailer.business_name || "N/A"}</TableCell>
                          <TableCell className="text-right">{retailer.order_count}</TableCell>
                          <TableCell className="text-right">₹{retailer.total_spent.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
