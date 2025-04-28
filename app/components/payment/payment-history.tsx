"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPaymentsByCustomerId } from "@/lib/payment-gateway-integration"
import { Loader2, CreditCard, Download, ExternalLink, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PaymentHistoryProps {
  customerId: string
}

export function PaymentHistory({ customerId }: PaymentHistoryProps) {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPayments = async () => {
      if (!customerId) return

      setIsLoading(true)
      try {
        const { data, error } = await getPaymentsByCustomerId(customerId)
        if (error) throw error

        setPayments(data || [])
      } catch (error) {
        console.error("Failed to load payments:", error)
        setError(error instanceof Error ? error.message : "Failed to load payment history")
      } finally {
        setIsLoading(false)
      }
    }

    loadPayments()
  }, [customerId])

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Refunded</Badge>
      case "partially_refunded":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Partially Refunded</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (gateway: string) => {
    switch (gateway) {
      case "razorpay":
        return <img src="/payment-icons/razorpay.svg" alt="Razorpay" className="h-5 w-5" />
      case "paytm":
        return <img src="/payment-icons/paytm.svg" alt="Paytm" className="h-5 w-5" />
      case "phonepe":
        return <img src="/payment-icons/phonepe.svg" alt="PhonePe" className="h-5 w-5" />
      case "payu":
        return <img src="/payment-icons/payu.svg" alt="PayU" className="h-5 w-5" />
      case "upi":
        return <img src="/payment-icons/upi.svg" alt="UPI" className="h-5 w-5" />
      case "cod":
        return <CreditCard className="h-5 w-5 text-gray-500" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment History")}</CardTitle>
          <CardDescription>{t("View your recent payment transactions")}</CardDescription>
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
          <CardTitle>{t("Payment History")}</CardTitle>
          <CardDescription>{t("View your recent payment transactions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-gray-500">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment History")}</CardTitle>
          <CardDescription>{t("View your recent payment transactions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t("No payment transactions found")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Payment History")}</CardTitle>
        <CardDescription>{t("View your recent payment transactions")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">#{payment.id.slice(0, 8).toUpperCase()}</span>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(payment.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.gateway)}
                    <span className="capitalize">
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
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    <div className="text-sm text-gray-500">
                      {t("Order")}: #{payment.order_id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {payment.description ||
                    t("Payment for order #{id}", { id: payment.order_id.slice(0, 8).toUpperCase() })}
                </div>
                <div className="flex gap-2">
                  {payment.status === "completed" && (
                    <Button variant="ghost" size="sm" className="h-8">
                      <Download className="h-4 w-4 mr-1" />
                      {t("Receipt")}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8" asChild>
                    <Link href={`/retailer/orders/${payment.order_id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t("View Order")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
