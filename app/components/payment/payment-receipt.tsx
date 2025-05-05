"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, Share2 } from "lucide-react"
import { format } from "date-fns"
import type { Payment, Order } from "@/lib/types"

interface PaymentReceiptProps {
  payment: Payment
  order: Order
}

export function PaymentReceipt({ payment, order }: PaymentReceiptProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/payments/receipt/download?paymentId=${payment.id}`)

      if (!response.ok) {
        throw new Error("Failed to generate receipt")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `receipt-${payment.reference_id || payment.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading receipt:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Receipt - ${payment.reference_id || payment.id}`,
          text: `Payment receipt for order #${order.order_number}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing receipt:", error)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard")
    }
  }

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Payment Receipt</CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-500">Receipt #: {payment.reference_id || payment.id}</p>
            <p className="text-sm text-gray-500">
              Date: {format(new Date(payment.payment_date || payment.created_at), "dd MMM yyyy")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Order Information</h3>
            <p className="text-sm">Order #: {order.order_number}</p>
            <p className="text-sm">Date: {format(new Date(order.created_at), "dd MMM yyyy")}</p>
            <p className="text-sm">Status: {order.status}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Payment Information</h3>
            <p className="text-sm">Method: {payment.payment_method}</p>
            <p className="text-sm">Status: {payment.payment_status}</p>
            {payment.transaction_id && <p className="text-sm">Transaction ID: {payment.transaction_id}</p>}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="font-semibold">Order Summary</h3>

          <div className="border rounded-md">
            <div className="grid grid-cols-4 gap-4 p-4 font-medium bg-gray-50">
              <div>Item</div>
              <div className="text-right">Price</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Total</div>
            </div>
            <Separator />
            {order.items?.map((item) => (
              <div key={item.id} className="grid grid-cols-4 gap-4 p-4">
                <div>{item.product?.name || `Product #${item.product_id}`}</div>
                <div className="text-right">₹{item.unit_price.toFixed(2)}</div>
                <div className="text-right">{item.quantity}</div>
                <div className="text-right">₹{item.total_price.toFixed(2)}</div>
              </div>
            ))}
            <Separator />
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{order.delivery_charge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{order.delivery_charge_gst.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{(order.total_amount + order.delivery_charge + order.delivery_charge_gst).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact our support team.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Download"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  )
}
