"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState("30")
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      customersGrowth: 0,
    },
    revenueByDay: [],
    ordersByStatus: [],
    topProducts: [],
    topCustomers: [],
    salesByCategory: [],
  })

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // In a real app, this would be an actual API call with the time range
        // For now, we'll simulate the data
        const mockData = {
          summary: {
            totalRevenue: 125000,
            totalOrders: 156,
            totalCustomers: 42,
            totalProducts: 78,
            averageOrderValue: 801.28,
            revenueGrowth: 12.5,
            ordersGrowth: 8.3,
            customersGrowth: 15.2,
          },
          revenueByDay: [
            { date: "2023-06-01", revenue: 3200 },
            { date: "2023-06-02", revenue: 4500 },
            { date: "2023-06-03", revenue: 3800 },
            { date: "2023-06-04", revenue: 4100 },
            { date: "2023-06-05", revenue: 5200 },
            { date: "2023-06-06", revenue: 4800 },
            { date: "2023-06-07", revenue: 5500 },
            { date: "2023-06-08", revenue: 6200 },
            { date: "2023-06-09", revenue: 5800 },
            { date: "2023-06-10", revenue: 6500 },
            { date: "2023-06-11", revenue: 7200 },
            { date: "2023-06-12", revenue: 6800 },
            { date: "2023-06-13", revenue: 7500 },
            { date: "2023-06-14", revenue: 8200 },
          ],
          ordersByStatus: [
            { status: "Pending", value: 12 },
            { status: "Confirmed", value: 24 },
            { status: "Processing", value: 18 },
            { status: "Shipped", value: 36 },
            { status: "Delivered", value: 62 },
            { status: "Cancelled", value: 4 },
          ],
          topProducts: [
            { name: "Rice (5kg)", sales: 42, revenue: 12600 },
            { name: "Wheat Flour", sales: 38, revenue: 9500 },
            { name: "Cooking Oil (1L)", sales: 35, revenue: 8750 },
            { name: "Sugar (1kg)", sales: 32, revenue: 6400 },
            { name: "Dal (2kg)", sales: 28, revenue: 8400 },
          ],
          topCustomers: [
            { name: "Suresh Store", orders: 12, spent: 9600 },
            { name: "Ganesh Kirana", orders: 10, spent: 8200 },
            { name: "Lakshmi Supermarket", orders: 8, spent: 7500 },
            { name: "Ravi General Store", orders: 7, spent: 6800 },
            { name: "Krishna Mart", orders: 6, spent: 5400 },
          ],
          salesByCategory: [
            { name: "Grains", value: 35 },
            { name: "Oils", value: 25 },
            { name: "Pulses", value: 20 },
            { name: "Sugar", value: 10 },
            { name: "Spices", value: 10 },
          ],
        }

        setAnalyticsData(mockData)
      } catch (error) {
        console.error("Failed to load analytics data:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [user, timeRange])

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    })

    // In a real app, this would trigger an actual CSV download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your report has been downloaded successfully.",
      })
    }, 2000)
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">{t("Analytics Dashboard")}</h1>
              <p className="text-gray-500">{t("Track your business performance and insights")}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("Time Range")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t("Last 7 days")}</SelectItem>
                    <SelectItem value="30">{t("Last 30 days")}</SelectItem>
                    <SelectItem value="90">{t("Last 90 days")}</SelectItem>
                    <SelectItem value="365">{t("Last year")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportCSV}>
                <Download className="mr-2 h-5 w-5" />
                {t("Export CSV")}
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Total Revenue")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalRevenue)}</div>
                    <div className="flex items-center text-sm">
                      {analyticsData.summary.revenueGrowth >= 0 ? (
                        <span className="flex items-center text-green-600">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {analyticsData.summary.revenueGrowth}%
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          {Math.abs(analyticsData.summary.revenueGrowth)}%
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">{t("vs last period")}</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Total Orders")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold">{analyticsData.summary.totalOrders}</div>
                    <div className="flex items-center text-sm">
                      {analyticsData.summary.ordersGrowth >= 0 ? (
                        <span className="flex items-center text-green-600">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {analyticsData.summary.ordersGrowth}%
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          {Math.abs(analyticsData.summary.ordersGrowth)}%
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">{t("vs last period")}</span>
                    </div>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Total Customers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold">{analyticsData.summary.totalCustomers}</div>
                    <div className="flex items-center text-sm">
                      {analyticsData.summary.customersGrowth >= 0 ? (
                        <span className="flex items-center text-green-600">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {analyticsData.summary.customersGrowth}%
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          {Math.abs(analyticsData.summary.customersGrowth)}%
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">{t("vs last period")}</span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Average Order Value")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold">{formatCurrency(analyticsData.summary.averageOrderValue)}</div>
                    <div className="text-sm text-gray-500">{t("Per order")}</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  {t("Revenue Over Time")}
                </CardTitle>
                <CardDescription>{t("Daily revenue for the selected period")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.revenueByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name={t("Revenue")}
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {t("Orders by Status")}
                </CardTitle>
                <CardDescription>{t("Distribution of orders by their current status")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.ordersByStatus} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name={t("Orders")} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Top Products */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {t("Top Selling Products")}
                </CardTitle>
                <CardDescription>{t("Products with the highest sales volume")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t("Product")}</th>
                        <th className="text-right py-3 px-4">{t("Units Sold")}</th>
                        <th className="text-right py-3 px-4">{t("Revenue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topProducts.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4 text-right">{product.sales}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Sales by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {t("Sales by Category")}
                </CardTitle>
                <CardDescription>{t("Distribution of sales across product categories")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                {t("Top Customers")}
              </CardTitle>
              <CardDescription>{t("Customers with the highest order value")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">{t("Customer")}</th>
                      <th className="text-right py-3 px-4">{t("Orders")}</th>
                      <th className="text-right py-3 px-4">{t("Total Spent")}</th>
                      <th className="text-right py-3 px-4">{t("Average Order Value")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topCustomers.map((customer, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{customer.name}</td>
                        <td className="py-3 px-4 text-right">{customer.orders}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(customer.spent)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(customer.spent / customer.orders)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
