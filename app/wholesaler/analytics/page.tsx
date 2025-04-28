"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/app/components/dashboard/stat-card"
import { ChartCard } from "@/app/components/dashboard/chart-card"
import { DataTable } from "@/app/components/dashboard/data-table"
import { ForecastChart } from "@/app/components/dashboard/forecast-chart"
import { DateRangePicker } from "@/app/components/dashboard/date-range-picker"
import { ExportOptions } from "@/app/components/dashboard/export-options"
import { TranslationProvider, useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { format } from "date-fns"
import { ShoppingBag, IndianRupee, TrendingUp, Package, Filter, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import { generateForecast, dateRangeToSupabaseFilter } from "@/lib/analytics-utils"
import { Badge } from "@/components/ui/badge"

function WholesalerAnalyticsDashboardContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState("week")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [retailers, setRetailers] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedRetailer, setSelectedRetailer] = useState<string>("")
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    ordersByStatus: [],
    ordersByDay: [],
    revenueByDay: [],
    topProducts: [],
    topRetailers: [],
    orderForecast: [],
    revenueForecast: [],
    productSalesForecast: [],
  })

  useEffect(() => {
    if (user?.role !== "wholesaler") {
      // Redirect non-wholesaler users
      window.location.href = "/"
      return
    }

    loadFilterOptions()
    loadAnalytics()
  }, [user, timeframe, dateRange, selectedCategory, selectedRetailer])

  const loadFilterOptions = async () => {
    if (!user) return

    try {
      // Load product categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("products")
        .select("category")
        .eq("user_id", user.id)
        .not("category", "is", null)
        .order("category")
        .distinct()

      if (categoriesError) {
        console.error("Error loading categories:", categoriesError)
      } else if (categoriesData) {
        setCategories(categoriesData.map((item) => item.category))
      }

      // Load retailers
      const { data: retailersData, error: retailersError } = await supabase
        .from("orders")
        .select("retailer:retailer_id(id, name)")
        .eq("wholesaler_id", user.id)
        .order("created_at", { ascending: false })
        .distinct()

      if (retailersError) {
        console.error("Error loading retailers:", retailersError)
      } else if (retailersData) {
        const uniqueRetailers = retailersData
          .map((item) => item.retailer)
          .filter((retailer, index, self) => retailer && index === self.findIndex((r) => r && r.id === retailer.id))
        setRetailers(uniqueRetailers)
      }
    } catch (error) {
      console.error("Error loading filter options:", error)
    }
  }

  const loadAnalytics = async () => {
    if (!user) return

    setLoading(true)
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

      // Build query for orders
      let ordersQuery = supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("wholesaler_id", user.id)
        .filter(timeFilter, {})

      // Apply retailer filter if selected
      if (selectedRetailer) {
        ordersQuery = ordersQuery.eq("retailer_id", selectedRetailer)
      }

      // Apply category filter if selected (more complex)
      if (selectedCategory) {
        ordersQuery = ordersQuery.in(
          "id",
          supabase
            .from("order_items")
            .select("order_id")
            .in(
              "product_id",
              supabase.from("products").select("id").eq("user_id", user.id).eq("category", selectedCategory),
            ),
        )
      }

      // Get total orders
      const { count: totalOrders } = await ordersQuery

      // Build query for revenue
      let revenueQuery = supabase
        .from("payments")
        .select("amount")
        .eq("recipient_id", user.id)
        .eq("status", "completed")
        .filter(timeFilter, {})

      // Apply retailer filter if selected
      if (selectedRetailer) {
        revenueQuery = revenueQuery.eq("user_id", selectedRetailer)
      }

      // Get total revenue
      const { data: payments } = await revenueQuery

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Get orders by status
      const { data: ordersByStatus } = await supabase.rpc("get_wholesaler_orders_by_status_with_filters", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        retailer_id: selectedRetailer || null,
        category: selectedCategory || null,
      })

      // Get orders by day
      const { data: ordersByDay } = await supabase.rpc("get_wholesaler_orders_by_day_with_filters", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        retailer_id: selectedRetailer || null,
        category: selectedCategory || null,
      })

      // Get revenue by day
      const { data: revenueByDay } = await supabase.rpc("get_wholesaler_revenue_by_day_with_filters", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        retailer_id: selectedRetailer || null,
        category: selectedCategory || null,
      })

      // Get top products
      const { data: topProducts } = await supabase.rpc("get_wholesaler_top_products_with_filters", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        retailer_id: selectedRetailer || null,
        category: selectedCategory || null,
        limit_count: 5,
      })

      // Get top retailers
      const { data: topRetailers } = await supabase.rpc("get_wholesaler_top_retailers_with_filters", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        category: selectedCategory || null,
        limit_count: 5,
      })

      // Get product sales by day
      const { data: productSalesByDay } = await supabase.rpc("get_wholesaler_product_sales_by_day", {
        wholesaler_id: user.id,
        timeframe_filter: timeframe,
        date_range_start: dateRange?.from?.toISOString(),
        date_range_end: dateRange?.to?.toISOString(),
        retailer_id: selectedRetailer || null,
        category: selectedCategory || null,
      })

      // Generate order forecast
      const orderForecast = generateForecast(
        (ordersByDay || []).map((item) => ({
          date: item.date,
          value: item.count,
        })),
        14, // Forecast for next 14 days
      )

      // Generate revenue forecast
      const revenueForecast = generateForecast(
        (revenueByDay || []).map((item) => ({
          date: item.date,
          value: item.amount,
        })),
        14, // Forecast for next 14 days
      )

      // Generate product sales forecast
      const productSalesForecast = generateForecast(
        (productSalesByDay || []).map((item) => ({
          date: item.date,
          value: item.quantity,
        })),
        14, // Forecast for next 14 days
      )

      setAnalytics({
        totalOrders: totalOrders || 0,
        totalRevenue,
        ordersByStatus: ordersByStatus || [],
        ordersByDay: ordersByDay || [],
        revenueByDay: revenueByDay || [],
        topProducts: topProducts || [],
        topRetailers: topRetailers || [],
        orderForecast,
        revenueForecast,
        productSalesForecast,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSelectedCategory("")
    setSelectedRetailer("")
    setDateRange(undefined)
  }

  // Format data for charts
  const formatOrdersByDay = () => {
    return analytics.ordersByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      orders: item.count,
    }))
  }

  const formatRevenueByDay = () => {
    return analytics.revenueByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      revenue: item.amount,
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
    if (!selectedCategory && !selectedRetailer && !dateRange) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="text-sm text-muted-foreground mr-2">Active filters:</div>
        {selectedCategory && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Category: {selectedCategory}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedCategory("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {selectedRetailer && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Retailer: {retailers.find((r) => r.id === selectedRetailer)?.name}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedRetailer("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {dateRange && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Date: {format(dateRange.from!, "MMM d")} - {format(dateRange.to!, "MMM d")}
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

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Business Analytics</h1>
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
            dateRange={dateRange ? { from: dateRange.from!, to: dateRange.to! } : undefined}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Retailer</label>
                <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All retailers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All retailers</SelectItem>
                    {retailers.map((retailer) => (
                      <SelectItem key={retailer.id} value={retailer.id}>
                        {retailer.name}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Orders"
          value={analytics.totalOrders}
          icon={<ShoppingBag className="h-4 w-4" />}
          description={`in the selected period`}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${analytics.totalRevenue.toLocaleString()}`}
          icon={<IndianRupee className="h-4 w-4" />}
          description={`in the selected period`}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${analytics.totalOrders ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : 0}`}
          icon={<TrendingUp className="h-4 w-4" />}
          description={`in the selected period`}
        />
        <StatCard
          title="Products Sold"
          value={analytics.topProducts.reduce((sum: number, product: any) => sum + product.total_quantity, 0)}
          icon={<Package className="h-4 w-4" />}
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
            description="Number of orders received over time"
            data={formatOrdersByDay()}
            type="line"
            dataKeys={["orders"]}
            xAxisKey="date"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Revenue Over Time</h3>
            <ExportOptions
              data={formatRevenueByDay()}
              columns={[
                { key: "date", title: "Date" },
                { key: "revenue", title: "Revenue (₹)" },
              ]}
              filename="revenue-over-time"
              title="Revenue Over Time"
            />
          </div>
          <ChartCard
            title="Revenue Over Time"
            description="Revenue generated over time"
            data={formatRevenueByDay()}
            type="line"
            dataKeys={["revenue"]}
            xAxisKey="date"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Orders by Status</CardTitle>
              <ExportOptions
                data={formatOrdersByStatus().map((item) => ({
                  status: item.name,
                  count: item.value,
                  percentage: `${((item.value / analytics.totalOrders) * 100).toFixed(1)}%`,
                }))}
                columns={[
                  { key: "status", title: "Status" },
                  { key: "count", title: "Count" },
                  { key: "percentage", title: "Percentage" },
                ]}
                filename="orders-by-status"
                title="Orders by Status"
              />
            </div>
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Top Products</h3>
            <ExportOptions
              data={analytics.topProducts}
              columns={[
                { key: "product_name", title: "Product" },
                { key: "total_quantity", title: "Quantity Sold" },
                { key: "total_revenue", title: "Revenue (₹)" },
              ]}
              filename="top-products"
              title="Top Selling Products"
            />
          </div>
          <DataTable
            title="Top Products"
            description="Your best-selling products"
            columns={[
              { key: "product_name", title: "Product" },
              { key: "total_quantity", title: "Quantity Sold" },
              {
                key: "total_revenue",
                title: "Revenue",
                render: (value) => `₹${value.toLocaleString()}`,
              },
            ]}
            data={analytics.topProducts}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <ForecastChart
          title="Order Forecast"
          description="Historical data and 14-day forecast"
          data={analytics.orderForecast}
          valueLabel="orders"
        />
        <ForecastChart
          title="Revenue Forecast"
          description="Historical data and 14-day forecast"
          data={analytics.revenueForecast}
          valueLabel="revenue"
        />
      </div>

      <div className="mb-6">
        <ForecastChart
          title="Product Sales Forecast"
          description="Historical data and 14-day forecast for product quantities"
          data={analytics.productSalesForecast}
          valueLabel="quantity"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Top Retailers</h3>
          <ExportOptions
            data={analytics.topRetailers}
            columns={[
              { key: "retailer_name", title: "Retailer" },
              { key: "order_count", title: "Orders" },
              { key: "total_spent", title: "Total Spent (₹)" },
              { key: "average_order_value", title: "Avg. Order Value (₹)" },
            ]}
            filename="top-retailers"
            title="Top Retailers"
          />
        </div>
        <DataTable
          title="Top Retailers"
          description="Your most valuable customers"
          columns={[
            { key: "retailer_name", title: "Retailer" },
            { key: "order_count", title: "Orders" },
            {
              key: "total_spent",
              title: "Total Spent",
              render: (value) => `₹${value.toLocaleString()}`,
            },
            {
              key: "average_order_value",
              title: "Avg. Order Value",
              render: (value) => `₹${value.toLocaleString()}`,
            },
          ]}
          data={analytics.topRetailers}
        />
      </div>
    </div>
  )
}

export default function WholesalerAnalyticsDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <WholesalerAnalyticsDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
