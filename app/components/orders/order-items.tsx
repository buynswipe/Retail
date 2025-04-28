import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderItem } from "@/lib/types"

interface OrderItemsProps {
  items: OrderItem[]
  subtotal: number
  tax: number
  shippingCost: number
  totalAmount: number
}

export default function OrderItems({ items, subtotal, tax, shippingCost, totalAmount }: OrderItemsProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-left">SKU</th>
                <th className="border p-2 text-right">Price</th>
                <th className="border p-2 text-right">Quantity</th>
                <th className="border p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId} className="border-b">
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">{item.sku}</td>
                  <td className="border p-2 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="border p-2 text-right">{item.quantity}</td>
                  <td className="border p-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td colSpan={4} className="border p-2 text-right">
                  Subtotal:
                </td>
                <td className="border p-2 text-right">₹{subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={4} className="border p-2 text-right">
                  Tax:
                </td>
                <td className="border p-2 text-right">₹{tax.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={4} className="border p-2 text-right">
                  Shipping:
                </td>
                <td className="border p-2 text-right">₹{shippingCost.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={4} className="border p-2 text-right">
                  Total:
                </td>
                <td className="border p-2 text-right">₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Add the named export
export { OrderItems }
