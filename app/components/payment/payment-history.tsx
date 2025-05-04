"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPaymentsByUserId } from "@/lib/payment-service"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface PaymentHistoryProps {
  userId: string
  role: "retailer" | "wholesaler"
}

export function PaymentHistory({ userId, role }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true)
      try {
        const offset = (page - 1) * limit
        const { data, count, error } = await getPaymentsByUserId(userId, role, limit, offset)
        if (error) {
          console.error("Error fetching payments:", error)
        } else {
          setPayments(data || [])
          setTotalCount(count || 0)
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [userId, role, page])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Recent payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : payments.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                    <TableCell>{payment.order?.order_number || "N/A"}</TableCell>
                    <TableCell>₹{payment.amount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(payment.payment_status || "pending")}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.transaction_id?.substring(0, 12) || "N/A"}
                      {payment.transaction_id?.length > 12 ? "..." : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} payments
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">No payment history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
