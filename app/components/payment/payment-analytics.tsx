"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/app/components/dashboard/date-range-picker"
import { formatCurrency } from "@/lib/utils"
import { getPaymentAnalytics, type PaymentAnalytics, type PaymentAnalyticsFilters } from "@/lib/payment-analytics"
import { Loader2, Download, CreditCard, TrendingUp, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface PaymentAnalyticsDashboardProps {
  userId?: string
  userType?: "retailer" | "wholesaler" | "admin"
}

export function PaymentAnalyticsDashboard({ userId, userType = "admin" }: PaymentAnalyticsDashboardProps) {
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const filters: PaymentAnalyticsFilters = {}

        if (dateRange.from) {
          filters.startDate = dateRange.from.toISOString()
        }
        if (dateRange.to) {
          filters.endDate = dateRange.to.toISOString()
        }

        const { data, error } = await getPaymentAnalytics(filters)

        if (error) {
          throw error
        }
        setAnalytics(data)
      } catch (error) {
        console.error("Error loading payment analytics:", error)
        setError(error instanceof Error ? error.message : "Failed to load payment analytics")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [dateRange])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment Analytics")}</CardTitle>
          <CardDescription>{t("Analyze payment trends and patterns")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment Analytics")}</CardTitle>
          <CardDescription>{t("Analyze payment trends and patterns")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-500">{error}</p>
              <Button onClick={() => setIsLoading(true)} className="mt-4">
                {t("Retry")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment Analytics")}</CardTitle>
          <CardDescription>{t("Analyze payment trends and patterns")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-500">{t("No payment data available")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>{t("Payment Analytics")}</CardTitle>
          <CardDescription>{t("Analyze payment trends and patterns")}</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" className="w-full sm:w-auto" />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("Export")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Total Revenue")}</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(analytics.totalRevenue)}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Total Transactions")}</p>
                  <h3 className="text-3xl font-bold">{analytics.totalTransactions}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Average Order Value")}</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(analytics.averageOrderValue)}</h3>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="methods">{t("Payment Methods")}</TabsTrigger>
            <TabsTrigger value="status">{t("Payment Status")}</TabsTrigger>
            <TabsTrigger value="trends">{t("Trends")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Revenue Trend")}</CardTitle>
                  <CardDescription>{t("Daily revenue for the last 7 days")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.recentTrends}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
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

              <Card>
                <CardHeader>
                  <CardTitle>{t("Transaction Trend")}</CardTitle>
                  <CardDescription>{t("Daily transactions for the last 7 days")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.recentTrends}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="transactions" name={t("Transactions")} fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="methods">
            <Card>
              <CardHeader>
                <CardTitle>{t("Payment Method Distribution")}</CardTitle>
                <CardDescription>{t("Breakdown of payment methods used")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.paymentMethodBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="method"
                        >
                          {analytics.paymentMethodBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {analytics.paymentMethodBreakdown.map((method, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="h-4 w-4 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span>{method.method}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{method.count} txns</span>
                          <span className="font-medium">{formatCurrency(method.amount)}</span>
                          <span className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>{t("Payment Status Distribution")}</CardTitle>
                <CardDescription>{t("Breakdown of payment statuses")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.paymentStatusBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="status"
                        >
                          {analytics.paymentStatusBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {analytics.paymentStatusBreakdown.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="h-4 w-4 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="capitalize">{status.status}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{status.count} txns</span>
                          <span className="font-medium">{formatCurrency(status.amount)}</span>
                          <span className="text-sm text-gray-500">{status.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>{t("Payment Trends")}</CardTitle>
                <CardDescription>{t("Daily payment trends for the last 7 days")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.recentTrends}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "revenue") return formatCurrency(value as number)
                          return value
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name={t("Revenue")}
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="transactions"
                        name={t("Transactions")}
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
