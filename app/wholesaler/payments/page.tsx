"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { CreditCard, Clock, FileText, ArrowLeft, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { getPaymentsByUserId, getPaymentStatistics } from "@/lib/payment-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function PaymentsContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")

  useEffect(() => {
    if (user) {
      loadPayments()
      loadStatistics()
    }
  }, [user])

  const loadPayments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getPaymentsByUserId(user.id, "wholesaler")
      if (error) {
        console.error("Error loading payments:", error)
      } else if (data) {
        setPayments(data)
      }
    } catch (error) {
      console.error("Error loading payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!user) return

    try {
      const { data, error } = await getPaymentStatistics(user.id, "wholesaler")
      if (error) {
        console.error("Error loading payment statistics:", error)
      } else if (data) {
        setStatistics(data)
      }
    } catch (error) {
      console.error("Error loading payment statistics:", error)
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

  const isWithinTimeFilter = (dateString: string) => {
    if (timeFilter === "all") return true

    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    switch (timeFilter) {
      case "today":
        return diffDays === 0
      case "week":
        return diffDays <= 7
      case "month":
        return diffDays <= 30
      default:
        return true
    }
  }

  const filteredPayments = payments.filter((payment) => {
    // Filter by search term
    const searchMatch =
      payment.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_id.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by tab
    const statusMatch = activeTab === "all" || payment.payment_status === activeTab

    // Filter by time
    const timeMatch = isWithinTimeFilter(payment.created_at)

    return searchMatch && statusMatch && timeMatch
  })

  const handleExportCSV = () => {
    // In a real app, this would generate a CSV file with payment data
    alert("This would download a CSV file with payment data in a real app.")
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button asChild variant="outline">
          <Link href="/wholesaler/dashboard">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Payment Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                  <h3 className="text-3xl font-bold">₹{statistics.total_amount.toFixed(2)}</h3>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Received Payments</p>
                  <h3 className="text-3xl font-bold">₹{statistics.completed_amount.toFixed(2)}</h3>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                  <h3 className="text-3xl font-bold">₹{statistics.pending_amount.toFixed(2)}</h3>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                            <span className="font-medium">
                              {payment.payment_method === "cod" ? "Cash on Delivery" : "UPI"}
                            </span>
                          </p>
                          {payment.transaction_id && (
                            <p className="text-sm text-gray-500">
                              Transaction ID: <span className="font-medium">{payment.transaction_id}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Reference ID: <span className="font-medium">{payment.reference_id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">₹{payment.amount.toFixed(2)}</p>
                        <Button asChild size="sm" variant="outline" className="mt-2">
                          <Link href={`/wholesaler/orders?id=${payment.order_id}`}>View Order</Link>
                        </Button>
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
        </CardContent>
      </Card>
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
