"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/app/components/dashboard/stat-card"
import { ChartCard } from "@/app/components/dashboard/chart-card"
import { DataTable } from "@/app/components/dashboard/data-table"
import { ForecastChart } from "@/app/components/dashboard/forecast-chart"
import { DateRangePicker } from "@/app/components/dashboard/date-range-picker"
import { ExportOptions } from "@/app/components/dashboard/export-options"
import { RecommendationsCard } from "@/app/components/dashboard/recommendations-card"
import { TranslationProvider, useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { format } from "date-fns"
import { ShoppingBag, IndianRupee, TrendingUp, Filter, X, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import { generateForecast, generateProductRecommendations, dateRangeToSupabaseFilter } from "@/lib/analytics-utils"
import { Badge } from "@/components/ui/badge"

function RetailerAnalyticsDashboardContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState("week")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [wholesalers, setWholesalers] = useState<any[]>([])
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>("")
  const [productRecommendations, setProductRecommendations] = useState<any[]>([])
  const [loadingState, setLoadingState] = useState({
    wholesalers: false,
    orders: false,
    payments: false,
    ordersByStatus: false,
    ordersByDay: false,
    spendingByDay: false,
    topProducts: false,
    recentOrders: false,
  })
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalSpent: 0,
    ordersByStatus: [],
    ordersByDay: [],
    recentOrders: [],
    orderForecast: [],
    spendingForecast: [],
    topProducts: [],
  })

  useEffect(() => {
    if (user?.role !== "retailer") {
      // Redirect non-retailer users
      window.location.href = "/"
      return
    }

    loadWholesalers()
  }, [user])

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeframe, dateRange, selectedWholesaler])

  const loadWholesalers = async () => {
    if (!user) return

    setLoadingState((prev) => ({ ...prev, wholesalers: true }))
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("wholesaler:wholesaler_id(id, name)")
        .eq("retailer_id", user.id)
        .order("created_at", { ascending: false })
        .distinct()

      if (error) {
        console.error("Error loading wholesalers:", error)
      } else if (data) {
        const uniqueWholesalers = data
          .map((item) => item.wholesaler)
          .filter(
            (wholesaler, index, self) => wholesaler && index === self.findIndex((w) => w && w.id === wholesaler.id),
          )
        setWholesalers(uniqueWholesalers)
      }
    } catch (error) {
      console.error("Error loading wholesalers:", error)
    } finally {
      setLoadingState((prev) => ({ ...prev, wholesalers: false }))
    }
  }

  const loadAnalytics = useCallback(async () => {
    if (!user) return

    setLoading(true)
    // Reset all loading states
    setLoadingState({
      wholesalers: false,
      orders: true,
      payments: true,
      ordersByStatus: true,
      ordersByDay: true,
      spendingByDay: true,
      topProducts: true,
      recentOrders: true,
    })

    try {
      let timeFilter = ""

      if (dateRange) {
        timeFilter = dateRangeToSupabaseFilter(dateRange)
      } else {
        switch (timeframe) {
          case "day":
            timeFilter = "created_at > now() - interval '1 day'"
            break
          case "week":
            timeFilter = "created_at > now() - interval '7 days'"
            break
          case "month":
            timeFilter = "created_at > now() - interval '30 days'"
            break
          case "year":
            timeFilter = "created_at > now() - interval '365 days'"
            break
          default:
            timeFilter = "created_at > now() - interval '7 days'"
        }
      }

      // Use Promise.all to fetch data in parallel
      const [
        ordersResult,
        paymentsResult,
        ordersByStatusResult,
        ordersByDayResult,
        spendingByDayResult,
        topProductsResult,
        recentOrdersResult,
      ] = await Promise.all([
        // Get total orders
        (async () => {
          try {
            let ordersQuery = supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("retailer_id", user.id)
              .filter(timeFilter, {})

            // Apply wholesaler filter if selected
            if (selectedWholesaler) {
              ordersQuery = ordersQuery.eq("wholesaler_id", selectedWholesaler)
            }

            const { count } = await ordersQuery
            setLoadingState((prev) => ({ ...prev, orders: false }))
            return count || 0
          } catch (error) {
            console.error("Error fetching orders:", error)
            setLoadingState((prev) => ({ ...prev, orders: false }))
            return 0
          }
        })(),

        // Get total spent
        (async () => {
          try {
            let paymentsQuery = supabase
              .from("payments")
              .select("amount")
              .eq("user_id", user.id)
              .eq("status", "completed")
              .filter(timeFilter, {})

            // Apply wholesaler filter if selected
            if (selectedWholesaler) {
              paymentsQuery = paymentsQuery.eq("recipient_id", selectedWholesaler)
            }

            const { data: payments } = await paymentsQuery
            setLoadingState((prev) => ({ ...prev, payments: false }))
            return payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
          } catch (error) {
            console.error("Error fetching payments:", error)
            setLoadingState((prev) => ({ ...prev, payments: false }))
            return 0
          }
        })(),

        // Get orders by status
        (async () => {
          try {
            const { data } = await supabase.rpc("get_retailer_orders_by_status_with_filters", {
              retailer_id: user.id,
              timeframe_filter: timeframe,
              date_range_start: dateRange?.from?.toISOString(),
              date_range_end: dateRange?.to?.toISOString(),
              wholesaler_id: selectedWholesaler || null,
            })
            setLoadingState((prev) => ({ ...prev, ordersByStatus: false }))
            return data || []
          } catch (error) {
            console.error("Error fetching orders by status:", error)
            setLoadingState((prev) => ({ ...prev, ordersByStatus: false }))
            return []
          }
        })(),

        // Get orders by day
        (async () => {
          try {
            const { data } = await supabase.rpc("get_retailer_orders_by_day_with_filters", {
              retailer_id: user.id,
              timeframe_filter: timeframe,
              date_range_start: dateRange?.from?.toISOString(),
              date_range_end: dateRange?.to?.toISOString(),
              wholesaler_id: selectedWholesaler || null,
            })
            setLoadingState((prev) => ({ ...prev, ordersByDay: false }))
            return data || []
          } catch (error) {
            console.error("Error fetching orders by day:", error)
            setLoadingState((prev) => ({ ...prev, ordersByDay: false }))
            return []
          }
        })(),

        // Get spending by day
        (async () => {
          try {
            const { data } = await supabase.rpc("get_retailer_spending_by_day_with_filters", {
              retailer_id: user.id,
              timeframe_filter: timeframe,
              date_range_start: dateRange?.from?.toISOString(),
              date_range_end: dateRange?.to?.toISOString(),
              wholesaler_id: selectedWholesaler || null,
            })
            setLoadingState((prev) => ({ ...prev, spendingByDay: false }))
            return data || []
          } catch (error) {
            console.error("Error fetching spending by day:", error)
            setLoadingState((prev) => ({ ...prev, spendingByDay: false }))
            return []
          }
        })(),

        // Get top products purchased
        (async () => {
          try {
            const { data } = await supabase.rpc("get_retailer_top_products", {
              retailer_id: user.id,
              timeframe_filter: timeframe,
              date_range_start: dateRange?.from?.toISOString(),
              date_range_end: dateRange?.to?.toISOString(),
              wholesaler_id: selectedWholesaler || null,
              limit_count: 5,
            })
            setLoadingState((prev) => ({ ...prev, topProducts: false }))
            return data || []
          } catch (error) {
            console.error("Error fetching top products:", error)
            setLoadingState((prev) => ({ ...prev, topProducts: false }))
            return []
          }
        })(),

        // Get recent orders
        (async () => {
          try {
            let recentOrdersQuery = supabase
              .from("orders")
              .select(`
                id,
                status,
                total_amount,
                created_at,
                wholesaler:wholesaler_id(name)
              `)
              .eq("retailer_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5)

            // Apply wholesaler filter if selected
            if (selectedWholesaler) {
              recentOrdersQuery = recentOrdersQuery.eq("wholesaler_id", selectedWholesaler)
            }

            const { data } = await recentOrdersQuery
            setLoadingState((prev) => ({ ...prev, recentOrders: false }))
            return data || []
          } catch (error) {
            console.error("Error fetching recent orders:", error)
            setLoadingState((prev) => ({ ...prev, recentOrders: false }))
            return []
          }
        })(),
      ])

      // Process the results
      const totalOrders = ordersResult
      const totalSpent = paymentsResult
      const ordersByStatus = ordersByStatusResult
      const ordersByDay = ordersByDayResult
      const spendingByDay = spendingByDayResult
      const topProducts = topProductsResult
      const recentOrders = recentOrdersResult

      // Generate order forecast
      const orderForecast = generateForecast(
        (ordersByDay || []).map((item: any) => ({
          date: item.date,
          value: item.count,
        })),
        14, // Forecast for next 14 days
      )

      // Generate spending forecast
      const spendingForecast = generateForecast(
        (spendingByDay || []).map((item: any) => ({
          date: item.date,
          value: item.amount,
        })),
        14, // Forecast for next 14 days
      )

      // Generate product recommendations
      if (topProducts && topProducts.length > 0) {
        const purchaseData = topProducts.map((product: any) => ({
          productId: product.product_id,
          productName: product.product_name,
          categoryId: product.category_id || "unknown",
          quantity: product.total_quantity,
        }))

        const recommendations = generateProductRecommendations(purchaseData)
        setProductRecommendations(recommendations)
      }

      setAnalytics({
        totalOrders,
        totalSpent,
        ordersByStatus,
        ordersByDay,
        recentOrders,
        orderForecast,
        spendingForecast,
        topProducts,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [user, timeframe, dateRange, selectedWholesaler])

  const resetFilters = () => {
    setSelectedWholesaler("")
    setDateRange(undefined)
  }

  // Format data for charts
  const formatOrdersByDay = () => {
    return analytics.ordersByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      orders: item.count,
    }))
  }

  const formatOrdersByStatus = () => {
    const statusColors: Record<string, string> = {
      pending: "#FFBB28",
      confirmed: "#0088FE",
      dispatched: "#00C49F",
      delivered: "#00E396",
      cancelled: "#FF8042",
    }

    return analytics.ordersByStatus.map((item: any) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count,
      color: statusColors[item.status] || "#8884D8",
    }))
  }

  const renderActiveFilters = () => {
    if (!selectedWholesaler && !dateRange) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="text-sm text-muted-foreground mr-2">Active filters:</div>
        {selectedWholesaler && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Wholesaler: {wholesalers.find((w) => w.id === selectedWholesaler)?.name}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedWholesaler("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {dateRange && dateRange.from && dateRange.to && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Date: {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setDateRange(undefined)}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        <Button variant="ghost" size="sm" className="h-6" onClick={resetFilters}>
          Reset all
        </Button>
      </div>
    )
  }

  const isAnyDataLoading = () => {
    return Object.values(loadingState).some((state) => state === true)
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Your Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <DateRangePicker
            dateRange={
              dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined
            }
            onDateRangeChange={setDateRange}
          />

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Wholesaler</label>
                <Select value={selectedWholesaler} onValueChange={setSelectedWholesaler}>
                  <SelectTrigger>
                    <SelectValue placeholder="All wholesalers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wholesalers</SelectItem>
                    {wholesalers.map((wholesaler) => (
                      <SelectItem key={wholesaler.id} value={wholesaler.id}>
                        {wholesaler.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {renderActiveFilters()}

      {loading || isAnyDataLoading() ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
          <span>Loading analytics data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard
              title="Total Orders"
              value={analytics.totalOrders}
              icon={<ShoppingBag className="h-4 w-4" />}
              description={`in the selected period`}
            />
            <StatCard
              title="Total Spent"
              value={`₹${analytics.totalSpent.toLocaleString()}`}
              icon={<IndianRupee className="h-4 w-4" />}
              description={`in the selected period`}
            />
            <StatCard
              title="Average Order Value"
              value={`₹${analytics.totalOrders ? (analytics.totalSpent / analytics.totalOrders).toFixed(2) : 0}`}
              icon={<TrendingUp className="h-4 w-4" />}
              description={`in the selected period`}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Orders Over Time</h3>
                <ExportOptions
                  data={formatOrdersByDay()}
                  columns={[
                    { key: "date", title: "Date" },
                    { key: "orders", title: "Orders" },
                  ]}
                  filename="orders-over-time"
                  title="Orders Over Time"
                />
              </div>
              <ChartCard
                title="Orders Over Time"
                description="Number of orders placed over time"
                data={formatOrdersByDay()}
                type="line"
                dataKeys={["orders"]}
                xAxisKey="date"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Distribution of your orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formatOrdersByStatus().map((item) => (
                    <div key={item.name} className="flex items-center">
                      <div className="w-full flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.value} orders</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${(item.value / analytics.totalOrders) * 100}%`,
                              backgroundColor: item.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <ForecastChart
              title="Order Forecast"
              description="Historical data and 14-day forecast"
              data={analytics.orderForecast}
              valueLabel="orders"
            />
            <ForecastChart
              title="Spending Forecast"
              description="Historical data and 14-day forecast"
              data={analytics.spendingForecast}
              valueLabel="spending"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Top Purchased Products</h3>
                <ExportOptions
                  data={analytics.topProducts}
                  columns={[
                    { key: "product_name", title: "Product" },
                    { key: "total_quantity", title: "Quantity" },
                    { key: "total_amount", title: "Amount (₹)" },
                  ]}
                  filename="top-products"
                  title="Top Purchased Products"
                />
              </div>
              <DataTable
                title="Top Purchased Products"
                description="Products you purchase most frequently"
                columns={[
                  { key: "product_name", title: "Product" },
                  { key: "total_quantity", title: "Quantity" },
                  { key: "total_amount", title: "Amount", render: (value) => `₹${value.toLocaleString()}` },
                ]}
                data={analytics.topProducts}
              />
            </div>
            <RecommendationsCard
              title="Recommended Products"
              description="Based on your purchase history"
              recommendations={productRecommendations}
              userRole="retailer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Recent Orders</h3>
              <ExportOptions
                data={analytics.recentOrders.map((order: any) => ({
                  id: order.id,
                  status: order.status,
                  wholesaler: order.wholesaler?.name || "Unknown",
                  total_amount: order.total_amount,
                  created_at: format(new Date(order.created_at), "MMM dd, yyyy"),
                }))}
                columns={[
                  { key: "id", title: "Order ID" },
                  { key: "status", title: "Status" },
                  { key: "wholesaler", title: "Wholesaler" },
                  { key: "total_amount", title: "Amount (₹)" },
                  { key: "created_at", title: "Date" },
                ]}
                filename="recent-orders"
                title="Recent Orders"
              />
            </div>
            <DataTable
              title="Recent Orders"
              description="Your most recent orders"
              columns={[
                { key: "id", title: "Order ID", render: (value) => value.substring(0, 8) + "..." },
                {
                  key: "status",
                  title: "Status",
                  render: (value) => (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : value === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : value === "dispatched"
                              ? "bg-purple-100 text-purple-800"
                              : value === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                      }`}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  ),
                },
                {
                  key: "wholesaler",
                  title: "Wholesaler",
                  render: (value) => value?.name || "Unknown",
                },
                {
                  key: "total_amount",
                  title: "Amount",
                  render: (value) => `₹${value.toLocaleString()}`,
                },
                {
                  key: "created_at",
                  title: "Date",
                  render: (value) => format(new Date(value), "MMM dd, yyyy"),
                },
              ]}
              data={analytics.recentOrders}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default function RetailerAnalyticsDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <RetailerAnalyticsDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
