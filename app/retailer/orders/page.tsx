"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { orderService } from "@/lib/order-service"
import { EmptyState } from "@/app/components/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function RetailerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const ordersPerPage = 10

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const { data, count } = await orderService.getRetailerOrders({
          page: currentPage,
          limit: ordersPerPage,
        })
        setOrders(data)
        setTotalOrders(count)
        setTotalPages(Math.ceil(count / ordersPerPage))
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError("Failed to load orders. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageToShow
            if (totalPages <= 5) {
              pageToShow = i + 1
            } else if (currentPage <= 3) {
              pageToShow = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + i
            } else {
              pageToShow = currentPage - 2 + i
            }

            return (
              <PaginationItem key={pageToShow}>
                <PaginationLink onClick={() => handlePageChange(pageToShow)} isActive={currentPage === pageToShow}>
                  {pageToShow}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  if (loading && orders.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading orders...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No Orders Yet"
        description="You haven't placed any orders yet. Browse products to place your first order."
        actionLabel="Browse Products"
        actionHref="/retailer/browse"
      />
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <p className="text-gray-500">Total Orders: {totalOrders}</p>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-gray-50 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "shipped"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.wholesaler_name || "Wholesaler"}</p>
                  <p className="text-sm text-gray-500">
                    {order.items_count} {order.items_count === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(order.total_amount)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push(`/retailer/orders/${order.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {renderPagination()}
    </div>
  )
}
