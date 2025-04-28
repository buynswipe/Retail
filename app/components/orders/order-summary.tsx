import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderStatus } from "@/lib/types"

interface OrderSummaryProps {
  order: Order
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      PROCESSING: { color: "bg-blue-100 text-blue-800", label: "Processing" },
      SHIPPED: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
      DELIVERED: { color: "bg-green-100 text-green-800", label: "Delivered" },
      CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    }

    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Order ID</span>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Order Date</span>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Payment Method</span>
              <p className="font-medium">{order.paymentMethod || "Not specified"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Payment Status</span>
              <p className="font-medium">{order.paymentStatus}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Amount</span>
              <p className="font-medium">₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Delivery Address</span>
              <p className="font-medium">{order.shippingAddress}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">City</span>
              <p className="font-medium">{order.shippingCity}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Pincode</span>
              <p className="font-medium">{order.shippingPincode}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderSummary
