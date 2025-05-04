"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPaymentStatistics } from "@/lib/payment-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Loader2 } from "lucide-react"

interface PaymentAnalyticsProps {
  userId: string
  role: "retailer" | "wholesaler"
}

export function PaymentAnalytics({ userId, role }: PaymentAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const { data, error } = await getPaymentStatistics(userId, role, timeframe)
        if (error) {
          console.error("Error fetching payment statistics:", error)
        } else {
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching payment statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId, role, timeframe])

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Prepare data for payment methods pie chart
  const preparePaymentMethodsData = () => {
    if (!stats || !stats.paymentMethods) return []
    return Object.entries(stats.paymentMethods).map(([method, count]) => ({
      name: method.toUpperCase(),
      value: count,
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <CardDescription>Overview of your payment statistics</CardDescription>
        <Tabs defaultValue="month" className="w-full" onValueChange={(value) => setTimeframe(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Last 7 Days</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
            <TabsTrigger value="year">Last 12 Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalPayments || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{stats.totalAmount?.toFixed(2) || "0.00"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.completionRate?.toFixed(1) || "0"}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.pendingPayments || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Trends</CardTitle>
                <CardDescription>Daily payment amounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyTrends || []} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} height={60} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                      <Legend />
                      <Bar dataKey="amount" name="Payment Amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePaymentMethodsData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePaymentMethodsData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Summary</CardTitle>
                <CardDescription>Summary of tax collected and paid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Tax Collected</p>
                      <p className="text-xl font-bold">₹{stats.total_tax_collected?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Tax Paid</p>
                      <p className="text-xl font-bold">₹{stats.total_tax_paid?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Net Tax Liability</p>
                      <p className="text-xl font-bold">₹{stats.net_tax_liability?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">No payment data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
