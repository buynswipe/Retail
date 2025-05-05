"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { getPaymentsByUserId } from "@/lib/payment-service"
import { getPaymentMethodDistribution, getPaymentConversionRate } from "@/lib/payment-analytics"
import { ArrowLeft, Download, Search, CreditCard, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

function PaymentHistoryContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [filteredPayments, setFilteredPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month")
  const [methodDistribution, setMethodDistribution] = useState<any>({})
  const [conversionRate, setConversionRate] = useState<any>({})
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (user) {
      loadPaymentHistory()
      loadPaymentAnalytics()
    }
  }, [user, timeframe])

  const loadPaymentHistory = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getPaymentsByUserId(user?.id || "", "retailer", 100, 0)
      if (error) {
        throw error
      }
      setPayments(data)
      setFilteredPayments(data)
    } catch (error) {
      console.error("Error loading payment history:", error)
      toast({
        title: "Error",
        description: "Failed to load payment history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPaymentAnalytics = async () => {
    try {
      // Get payment method distribution
      const { distribution, error: distError } = await getPaymentMethodDistribution(timeframe)
      if (!distError) {
        setMethodDistribution(distribution)
      }

      // Get payment conversion rate
      const conversionData = await getPaymentConversionRate(timeframe)
      if (!conversionData.error) {
        setConversionRate(conversionData)
      }
    } catch (error) {
      console.error("Error loading payment analytics:", error)
    }
  }

  useEffect(() => {
    // Filter payments based on active tab and search query
    let filtered = [...payments]

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter((payment) => payment.payment_status === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (payment) =>
          payment.reference_id?.toLowerCase().includes(query) ||
          payment.transaction_id?.toLowerCase().includes(query) ||
          payment.order?.order_number?.toLowerCase().includes(query) ||
          payment.payment_method?.toLowerCase().includes(query),
      )
    }

    // Sort payments
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "amount":
          comparison = a.amount - b.amount
          break
        case "method":
          comparison = a.payment_method.localeCompare(b.payment_method)
          break
        case "status":
          comparison = a.payment_status.localeCompare(b.payment_status)
          break
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredPayments(filtered)
  }, [payments, activeTab, searchQuery, sortBy, sortOrder])

  const handleViewPayment = (orderId: string) => {
    router.push(`/retailer/orders/${orderId}`)
  }

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ["Date", "Reference ID", "Order Number", "Method", "Amount", "Status"]
    const rows = filteredPayments.map((payment) => [
      format(new Date(payment.created_at), "yyyy-MM-dd HH:mm:ss"),
      payment.reference_id || "",
      payment.order?.order_number || "",
      payment.payment_method,
      payment.amount.toFixed(2),
      payment.payment_status,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  // Prepare chart data
  const pieChartData = Object.entries(methodDistribution).map(([method, data]: [string, any]) => ({
    name: method.toUpperCase(),
    value: data.count,
  }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  const barChartData = [
    { name: "Initiated", value: conversionRate.initiated || 0 },
    { name: "Completed", value: conversionRate.completed || 0 },
    { name: "Failed", value: conversionRate.failed || 0 },
    { name: "Abandoned", value: conversionRate.abandoned || 0 },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/retailer/payments")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Payment History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>Distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} payments`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2">
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="year">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Conversion</CardTitle>
            <CardDescription>Initiated vs completed payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold">{(conversionRate.conversionRate || 0).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Summary</CardTitle>
            <CardDescription>Overview of your payment history</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-lg font-semibold text-green-600">
                    {payments.filter((p) => p.payment_status === "completed").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {payments.filter((p) => p.payment_status === "pending").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="text-lg font-semibold text-red-600">
                    {payments.filter((p) => p.payment_status === "failed").length}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Payment Transactions</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="method">Method</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <div className="grid grid-cols-6 p-4 font-medium bg-gray-50">
                <div>Date</div>
                <div>Reference</div>
                <div>Order</div>
                <div>Method</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Status</div>
              </div>

              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-6 p-4 border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewPayment(payment.order_id)}
                  >
                    <div className="text-gray-500">
                      {format(new Date(payment.created_at), "dd MMM yyyy")}
                      <div className="text-xs">{format(new Date(payment.created_at), "HH:mm")}</div>
                    </div>
                    <div className="truncate">{payment.reference_id || "-"}</div>
                    <div>{payment.order?.order_number || "-"}</div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="capitalize">{payment.payment_method}</span>
                    </div>
                    <div className="text-right font-medium">₹{payment.amount.toFixed(2)}</div>
                    <div className="text-right flex items-center justify-end">
                      {getPaymentStatusBadge(payment.payment_status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No payments found</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}

export default function PaymentHistoryPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <PaymentHistoryContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
