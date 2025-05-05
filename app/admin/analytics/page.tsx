"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/app/components/dashboard/stat-card"
import { ChartCard } from "@/app/components/dashboard/chart-card"
import { DataTable } from "@/app/components/dashboard/data-table"
import { PieChartCard } from "@/app/components/dashboard/pie-chart-card"
import { ForecastChart } from "@/app/components/dashboard/forecast-chart"
import { DateRangePicker } from "@/app/components/dashboard/date-range-picker"
import { ExportOptions } from "@/app/components/dashboard/export-options"
import { RecommendationsCard } from "@/app/components/dashboard/recommendations-card"
import { TranslationProvider, useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { useAuth } from "@/lib/auth-context"
import {
  getPlatformAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getDeliveryAnalytics,
  getAvailableRegions,
  getAvailableProductCategories,
  getAvailablePaymentMethods,
} from "@/lib/analytics-service"
import { format } from "date-fns"
import { Users, ShoppingBag, IndianRupee, Truck, Filter, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"
import { generateProductRecommendations } from "@/lib/analytics-utils"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"

function AnalyticsDashboardContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [timeframe, setTimeframe] = useState("week")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [regions, setRegions] = useState<string[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [productRecommendations, setProductRecommendations] = useState<any[]>([])
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [analytics, setAnalytics] = useState<any>({
    orders: {
      totalOrders: 0,
      ordersByStatus: [],
      ordersByDay: [],
      orderForecast: [],
    },
    revenue: {
      totalRevenue: 0,
      revenueByDay: [],
      revenueForecast: [],
    },
    users: {
      totalUsers: 0,
      newUsers: 0,
      usersByRole: [],
      usersByDay: [],
      userGrowthForecast: [],
    },
    products: {
      topProducts: [],
      productCategories: [],
      productSalesTrends: [],
      productSalesForecast: [],
    },
    delivery: {
      deliveryPerformance: [],
      avgDeliveryTime: 0,
      deliveryTimeTrends: [],
    },
  })

  useEffect(() => {
    if (user?.role !== "admin") {
      // Redirect non-admin users
      window.location.href = "/"
      return
    }

    loadFilterOptions()
    loadAnalytics()
  }, [user])

  useEffect(() => {
    loadAnalytics()
  }, [timeframe, dateRange, selectedRegion, selectedCategory, selectedPaymentMethod, activeTab])

  const loadFilterOptions = async () => {
    try {
      const [regionsData, categoriesData, paymentMethodsData] = await Promise.all([
        getAvailableRegions(),
        getAvailableProductCategories(),
        getAvailablePaymentMethods(),
      ])

      setRegions(regionsData)
      setProductCategories(categoriesData)
      setPaymentMethods(paymentMethodsData)
    } catch (error) {
      console.error("Error loading filter options:", error)
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const filters = {
        region: selectedRegion || undefined,
        productCategory: selectedCategory || undefined,
        paymentMethod: selectedPaymentMethod || undefined,
      }

      let data

      switch (activeTab) {
        case "overview":
          data = await getPlatformAnalytics(dateRange, filters)
          setAnalytics(data)

          // Generate product recommendations based on top products
          if (data.products.topProducts.length > 0) {
            const purchaseData = data.products.topProducts.map((product: any) => ({
              productId: product.product_id,
              productName: product.product_name,
              categoryId: product.category_id || "unknown",
              quantity: product.total_quantity,
            }))

            const recommendations = generateProductRecommendations(purchaseData)
            setProductRecommendations(recommendations)
          }
          break
        case "orders":
          data = await getOrderAnalytics(timeframe, dateRange, filters)
          setAnalytics((prev) => ({ ...prev, orders: data }))
          break
        case "revenue":
          data = await getRevenueAnalytics(timeframe, dateRange, filters)
          setAnalytics((prev) => ({ ...prev, revenue: data }))
          break
        case "users":
          data = await getUserAnalytics(timeframe, dateRange, {
            region: filters.region,
            role: undefined,
          })
          setAnalytics((prev) => ({ ...prev, users: data }))
          break
        case "products":
          data = await getProductAnalytics(timeframe, dateRange, {
            region: filters.region,
            category: filters.productCategory,
          })
          setAnalytics((prev) => ({ ...prev, products: data }))
          break
        case "delivery":
          data = await getDeliveryAnalytics(timeframe, dateRange, {
            region: filters.region,
          })
          setAnalytics((prev) => ({ ...prev, delivery: data }))
          break
        default:
          data = await getPlatformAnalytics(dateRange, filters)
          setAnalytics(data)
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSelectedRegion("")
    setSelectedCategory("")
    setSelectedPaymentMethod("")
    setDateRange(undefined)
  }

  // Format data for charts
  const formatOrdersByDay = () => {
    return analytics.orders.ordersByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      orders: item.count,
    }))
  }

  const formatRevenueByDay = () => {
    return analytics.revenue.revenueByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      revenue: item.amount,
    }))
  }

  const formatUsersByDay = () => {
    return analytics.users.usersByDay.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      users: item.count,
    }))
  }

  const formatOrdersByStatus = () => {
    return analytics.orders.ordersByStatus.map((item: any) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count,
    }))
  }

  const formatUsersByRole = () => {
    return analytics.users.usersByRole.map((item: any) => ({
      name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
      value: item.count,
    }))
  }

  const formatProductCategories = () => {
    return analytics.products.productCategories.map((item: any) => ({
      name: item.category,
      value: item.count,
    }))
  }

  const formatDeliveryPerformance = () => {
    return analytics.delivery.deliveryPerformance.map((item: any) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count,
    }))
  }

  const renderActiveFilters = () => {
    if (!selectedRegion && !selectedCategory && !selectedPaymentMethod && !dateRange) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="text-sm text-muted-foreground mr-2">Active filters:</div>
        {selectedRegion && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Region: {selectedRegion}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedRegion("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {selectedCategory && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Category: {selectedCategory}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSelectedCategory("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {selectedPaymentMethod && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Payment: {selectedPaymentMethod}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => setSelectedPaymentMethod("")}
            >
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
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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

          {!isMobile && (
            <DateRangePicker
              dateRange={dateRange ? { from: dateRange.from!, to: dateRange.to! } : undefined}
              onDateRangeChange={setDateRange}
            />
          )}

          {activeTab !== "overview" && (
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
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Region</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Product Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Payment Method</label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payment methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All payment methods</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isMobile && (
                <div className="md:col-span-3">
                  <label className="text-sm font-medium mb-1 block">Date Range</label>
                  <DateRangePicker
                    dateRange={dateRange ? { from: dateRange.from!, to: dateRange.to! } : undefined}
                    onDateRangeChange={setDateRange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {renderActiveFilters()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={analytics.orders.totalOrders}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
            <StatCard
              title="Total Revenue"
              value={`₹${analytics.revenue.totalRevenue.toLocaleString()}`}
              icon={<IndianRupee className="h-4 w-4" />}
            />
            <StatCard title="Total Users" value={analytics.users.totalUsers} icon={<Users className="h-4 w-4" />} />
            <StatCard
              title="Avg. Delivery Time"
              value={`${analytics.delivery.avgDeliveryTime.toFixed(1)} hrs`}
              icon={<Truck className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ForecastChart
              title="Orders Forecast"
              description="Historical data and 14-day forecast"
              data={analytics.orders.orderForecast}
              valueLabel="orders"
            />
            <ForecastChart
              title="Revenue Forecast"
              description="Historical data and 14-day forecast"
              data={analytics.revenue.revenueForecast}
              valueLabel="revenue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PieChartCard title="Orders by Status" data={formatOrdersByStatus()} dataKey="value" nameKey="name" />
            <PieChartCard title="Users by Role" data={formatUsersByRole()} dataKey="value" nameKey="name" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DataTable
              title="Top Selling Products"
              columns={[
                { key: "product_name", title: "Product" },
                { key: "total_quantity", title: "Quantity Sold" },
                { key: "total_revenue", title: "Revenue", render: (value) => `₹${value.toLocaleString()}` },
              ]}
              data={analytics.products.topProducts}
            />
            <RecommendationsCard
              title="Product Recommendations"
              description="Based on purchase patterns"
              recommendations={productRecommendations}
              userRole="admin"
            />
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={analytics.orders.totalOrders}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
            <StatCard
              title="Pending Orders"
              value={analytics.orders.ordersByStatus.find((item: any) => item.status === "pending")?.count || 0}
            />
            <StatCard
              title="Completed Orders"
              value={analytics.orders.ordersByStatus.find((item: any) => item.status === "completed")?.count || 0}
            />
            <StatCard
              title="Cancelled Orders"
              value={analytics.orders.ordersByStatus.find((item: any) => item.status === "cancelled")?.count || 0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Orders Trend"
              data={formatOrdersByDay()}
              type="line"
              dataKeys={["orders"]}
              xAxisKey="date"
            />
            <PieChartCard title="Orders by Status" data={formatOrdersByStatus()} dataKey="value" nameKey="name" />
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Order Forecast</h3>
            <ExportOptions
              data={analytics.orders.orderForecast.map((item: any) => ({
                date: item.date,
                orders: item.value,
                type: item.isForecast ? "Forecast" : "Historical",
              }))}
              columns={[
                { key: "date", title: "Date" },
                { key: "orders", title: "Orders" },
                { key: "type", title: "Data Type" },
              ]}
              filename="order-forecast"
              title="Order Forecast"
            />
          </div>

          <ForecastChart
            title="Orders Forecast"
            description="Historical data and 14-day forecast"
            data={analytics.orders.orderForecast}
            valueLabel="orders"
          />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={`₹${analytics.revenue.totalRevenue.toLocaleString()}`}
              icon={<IndianRupee className="h-4 w-4" />}
            />
            <StatCard
              title="Average Order Value"
              value={`₹${analytics.orders.totalOrders ? (analytics.revenue.totalRevenue / analytics.orders.totalOrders).toFixed(2) : 0}`}
            />
            <StatCard
              title="Revenue per User"
              value={`₹${analytics.users.totalUsers ? (analytics.revenue.totalRevenue / analytics.users.totalUsers).toFixed(2) : 0}`}
            />
            <StatCard
              title="Conversion Rate"
              value={`${analytics.orders.totalOrders && analytics.users.totalUsers ? ((analytics.orders.totalOrders / analytics.users.totalUsers) * 100).toFixed(1) : 0}%`}
            />
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Revenue Trend</h3>
            <ExportOptions
              data={formatRevenueByDay()}
              columns={[
                { key: "date", title: "Date" },
                { key: "revenue", title: "Revenue (₹)" },
              ]}
              filename="revenue-trend"
              title="Revenue Trend"
            />
          </div>

          <ChartCard
            title="Revenue Trend"
            data={formatRevenueByDay()}
            type="line"
            dataKeys={["revenue"]}
            xAxisKey="date"
          />

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Revenue Forecast</h3>
            <ExportOptions
              data={analytics.revenue.revenueForecast.map((item: any) => ({
                date: item.date,
                revenue: item.value,
                type: item.isForecast ? "Forecast" : "Historical",
              }))}
              columns={[
                { key: "date", title: "Date" },
                { key: "revenue", title: "Revenue (₹)" },
                { key: "type", title: "Data Type" },
              ]}
              filename="revenue-forecast"
              title="Revenue Forecast"
            />
          </div>

          <ForecastChart
            title="Revenue Forecast"
            description="Historical data and 14-day forecast"
            data={analytics.revenue.revenueForecast}
            valueLabel="revenue"
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={analytics.users.totalUsers} icon={<Users className="h-4 w-4" />} />
            <StatCard
              title="New Users"
              value={analytics.users.newUsers}
              description={`in the last ${timeframe === "day" ? "24 hours" : timeframe === "week" ? "7 days" : timeframe === "month" ? "30 days" : "year"}`}
            />
            <StatCard
              title="Retailers"
              value={analytics.users.usersByRole.find((item: any) => item.role === "retailer")?.count || 0}
            />
            <StatCard
              title="Wholesalers"
              value={analytics.users.usersByRole.find((item: any) => item.role === "wholesaler")?.count || 0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">New User Registrations</h3>
                <ExportOptions
                  data={formatUsersByDay()}
                  columns={[
                    { key: "date", title: "Date" },
                    { key: "users", title: "New Users" },
                  ]}
                  filename="user-registrations"
                  title="New User Registrations"
                />
              </div>
              <ChartCard
                title="New User Registrations"
                data={formatUsersByDay()}
                type="bar"
                dataKeys={["users"]}
                xAxisKey="date"
              />
            </div>
            <PieChartCard title="Users by Role" data={formatUsersByRole()} dataKey="value" nameKey="name" />
          </div>

          <ForecastChart
            title="User Growth Forecast"
            description="Historical data and 30-day forecast"
            data={analytics.users.userGrowthForecast}
            valueLabel="users"
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Product Categories</h3>
                <ExportOptions
                  data={formatProductCategories()}
                  columns={[
                    { key: "name", title: "Category" },
                    { key: "value", title: "Count" },
                  ]}
                  filename="product-categories"
                  title="Product Categories"
                />
              </div>
              <PieChartCard
                title="Product Categories"
                data={formatProductCategories()}
                dataKey="value"
                nameKey="name"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Top Selling Products</h3>
                <ExportOptions
                  data={analytics.products.topProducts}
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
                title="Top Selling Products"
                columns={[
                  { key: "product_name", title: "Product" },
                  { key: "total_quantity", title: "Quantity Sold" },
                  { key: "total_revenue", title: "Revenue", render: (value) => `₹${value.toLocaleString()}` },
                ]}
                data={analytics.products.topProducts}
              />
            </div>
          </div>

          <ForecastChart
            title="Product Sales Forecast"
            description="Historical data and 14-day forecast"
            data={analytics.products.productSalesForecast}
            valueLabel="quantity"
          />

          <RecommendationsCard
            title="Product Recommendations"
            description="Based on purchase patterns"
            recommendations={productRecommendations}
            userRole="admin"
          />
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Avg. Delivery Time"
              value={`${analytics.delivery.avgDeliveryTime.toFixed(1)} hrs`}
              icon={<Truck className="h-4 w-4" />}
            />
            <StatCard
              title="Completed Deliveries"
              value={
                analytics.delivery.deliveryPerformance.find((item: any) => item.status === "delivered")?.count || 0
              }
            />
            <StatCard
              title="In Transit"
              value={
                analytics.delivery.deliveryPerformance.find((item: any) => item.status === "in_transit")?.count || 0
              }
            />
            <StatCard
              title="Delayed"
              value={analytics.delivery.deliveryPerformance.find((item: any) => item.status === "delayed")?.count || 0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Delivery Performance</h3>
                <ExportOptions
                  data={formatDeliveryPerformance()}
                  columns={[
                    { key: "name", title: "Status" },
                    { key: "value", title: "Count" },
                  ]}
                  filename="delivery-performance"
                  title="Delivery Performance"
                />
              </div>
              <PieChartCard
                title="Delivery Performance"
                data={formatDeliveryPerformance()}
                dataKey="value"
                nameKey="name"
              />
            </div>
            <ChartCard
              title="Delivery Time Trends"
              description="Average delivery time in hours"
              data={analytics.delivery.deliveryTimeTrends.map((item: any) => ({
                date: format(new Date(item.date), "MMM dd"),
                time: item.avg_time,
              }))}
              type="line"
              dataKeys={["time"]}
              xAxisKey="date"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AnalyticsDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <AnalyticsDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
