"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { PaymentHistory } from "@/app/components/payment/payment-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getPaymentsByCustomerId } from "@/lib/payment-gateway-integration"
import { formatCurrency } from "@/lib/utils"
import { CreditCard, IndianRupee, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function PaymentDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await getPaymentsByCustomerId(user.id)
        if (error) throw error

        setPayments(data || [])
      } catch (error) {
        console.error("Failed to load payments:", error)
        toast({
          title: "Error",
          description: "Failed to load payment data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadPayments()
    }
  }, [user])

  const getPaymentStats = () => {
    if (!payments.length) {
      return {
        totalSpent: 0,
        pendingAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
      }
    }

    return payments.reduce(
      (stats, payment) => {
        if (payment.status === "completed") {
          stats.totalSpent += payment.amount
          stats.completedPayments += 1
        } else if (payment.status === "pending") {
          stats.pendingAmount += payment.amount
          stats.pendingPayments += 1
        } else if (payment.status === "failed") {
          stats.failedPayments += 1
        }
        return stats
      },
      {
        totalSpent: 0,
        pendingAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
      },
    )
  }

  const stats = getPaymentStats()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">{t("Payments Dashboard")}</h1>
              <p className="text-gray-500">{t("Manage your payments and transactions")}</p>
            </div>
            <Button asChild>
              <Link href="/retailer/orders">
                <CreditCard className="mr-2 h-5 w-5" />
                {t("View Orders")}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Total Spent")}</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(stats.totalSpent)}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Pending Amount")}</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(stats.pendingAmount)}</h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Payment Status")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm">{stats.completedPayments}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm">{stats.pendingPayments}</span>
                      </div>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm">{stats.failedPayments}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
              <TabsTrigger value="history">{t("Payment History")}</TabsTrigger>
              <TabsTrigger value="pending">{t("Pending Payments")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Recent Transactions")}</CardTitle>
                    <CardDescription>{t("Your most recent payment transactions")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t("Loading transactions...")}</p>
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t("No transactions found")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.slice(0, 5).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  payment.status === "completed"
                                    ? "bg-green-100"
                                    : payment.status === "pending"
                                      ? "bg-amber-100"
                                      : "bg-red-100"
                                }`}
                              >
                                {payment.status === "completed" ? (
                                  <ArrowUpRight
                                    className={`h-5 w-5 ${
                                      payment.status === "completed"
                                        ? "text-green-600"
                                        : payment.status === "pending"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`}
                                  />
                                ) : (
                                  <ArrowDownRight
                                    className={`h-5 w-5 ${
                                      payment.status === "completed"
                                        ? "text-green-600"
                                        : payment.status === "pending"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }`}
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {payment.gateway === "razorpay"
                                    ? "Credit/Debit Card"
                                    : payment.gateway === "paytm"
                                      ? "Paytm"
                                      : payment.gateway === "phonepe"
                                        ? "PhonePe"
                                        : payment.gateway === "payu"
                                          ? "Netbanking"
                                          : payment.gateway === "upi"
                                            ? "UPI"
                                            : payment.gateway === "cod"
                                              ? "Cash on Delivery"
                                              : payment.gateway}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {t("Order")}: #{payment.order_id.slice(0, 8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("Payment Methods")}</CardTitle>
                    <CardDescription>{t("Manage your payment methods")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{t("Credit/Debit Cards")}</p>
                            <p className="text-sm text-gray-500">{t("Visa, Mastercard, RuPay")}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {t("Manage")}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <img src="/UPI-symbol.png" alt="UPI" className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{t("UPI")}</p>
                            <p className="text-sm text-gray-500">{t("Google Pay, PhonePe, Paytm")}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {t("Manage")}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{t("Wallets")}</p>
                            <p className="text-sm text-gray-500">{t("Paytm, Amazon Pay, MobiKwik")}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {t("Manage")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <PaymentHistory customerId={user?.id || ""} />
            </TabsContent>
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Pending Payments")}</CardTitle>
                  <CardDescription>{t("Payments that are yet to be completed")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">{t("Loading pending payments...")}</p>
                    </div>
                  ) : payments.filter((p) => p.status === "pending").length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500">{t("No pending payments")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments
                        .filter((p) => p.status === "pending")
                        .map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {t("Order")} #{payment.order_id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(payment.created_at).toLocaleDateString()} • {payment.gateway}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <Button size="sm" className="mt-2" asChild>
                                <Link href={`/retailer/checkout/payment?orderId=${payment.order_id}`}>
                                  {t("Complete Payment")}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
