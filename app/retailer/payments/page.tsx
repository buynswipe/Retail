"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, History, ArrowRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { getPaymentsByUserId, getPaymentStatistics } from "@/lib/payment-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function PaymentsContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month")

  useEffect(() => {
    if (user) {
      loadPayments()
      loadStatistics()
    }
  }, [user, timeframe])

  const loadPayments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getPaymentsByUserId(user.id, "retailer", 10, 0)
      if (error) {
        console.error("Error loading payments:", error)
        toast({
          title: "Error",
          description: "Failed to load payments. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setPayments(data)
      }
    } catch (error) {
      console.error("Error loading payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!user) return

    try {
      const { data, error } = await getPaymentStatistics(user.id, "retailer", timeframe)
      if (error) {
        console.error("Error loading payment statistics:", error)
        toast({
          title: "Error",
          description: "Failed to load payment statistics. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setStatistics(data)
      }
    } catch (error) {
      console.error("Error loading payment statistics:", error)
      toast({
        title: "Error",
        description: "Failed to load payment statistics. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadgeColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const filteredPayments = payments.filter((payment) => {
    // Filter by search term
    const searchMatch =
      payment.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by tab
    if (activeTab === "all") return searchMatch
    return payment.payment_status === activeTab && searchMatch
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Payments</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/retailer/payments/history")}>
            <History className="mr-2 h-4 w-4" />
            Payment History
          </Button>
          <Button onClick={() => router.push("/retailer/checkout")}>
            Make Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics.totalPayments || 0}</div>
              <p className="text-sm text-gray-500">{statistics.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(statistics.totalAmount || 0).toFixed(2)}</div>
              <p className="text-sm text-gray-500">{statistics.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(statistics.completionRate || 0).toFixed(1)}%</div>
              <p className="text-sm text-gray-500">
                {statistics.completedPayments || 0} of {statistics.totalPayments || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.paymentMethods &&
                  Object.entries(statistics.paymentMethods).map(([method, count]: [string, any]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="capitalize">{method}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="flex justify-end mb-4">
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search by order number or transaction ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.payment_status)}
                          <h3 className="text-lg font-semibold">Order #{payment.order?.order_number}</h3>
                          <Badge className={getStatusBadgeColor(payment.payment_status)}>
                            {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500">
                            {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Payment Method:{" "}
                            <span className="font-medium capitalize">
                              {payment.payment_method === "cod" ? "Cash on Delivery" : payment.payment_method}
                            </span>
                          </p>
                          {payment.transaction_id && (
                            <p className="text-sm text-gray-500">
                              Transaction ID: <span className="font-medium">{payment.transaction_id}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right mt-4 md:mt-0">
                        <p className="text-lg font-semibold">₹{payment.amount.toFixed(2)}</p>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/retailer/orders/${payment.order_id}`)}
                          >
                            View Order
                          </Button>
                          {payment.payment_status === "pending" && payment.payment_method !== "cod" && (
                            <Button
                              size="sm"
                              className="ml-2 bg-blue-500 hover:bg-blue-600"
                              onClick={() => router.push(`/retailer/orders/${payment.order_id}`)}
                            >
                              Complete Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No payments found.</p>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => router.push("/retailer/payments/history")}>
                View All Payments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <PaymentsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
