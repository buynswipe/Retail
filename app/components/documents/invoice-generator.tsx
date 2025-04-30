"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Download } from "lucide-react"
import type { Order } from "@/lib/types"

interface InvoiceGeneratorProps {
  order: Order
  onClose: () => void
}

export function InvoiceGenerator({ order, onClose }: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    setIsGenerating(true)

    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Invoice</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; padding: 20px; }
          .invoice-container { max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .mb-6 { margin-bottom: 24px; }
          .mt-8 { margin-top: 32px; }
          .border-t { border-top: 1px solid #ddd; padding-top: 16px; }
          .border-dashed { border-top: 1px dashed #000; width: 160px; }
          @media print {
            button { display: none; }
          }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write('<div class="invoice-container">')
        printWindow.document.write(invoiceRef.current.innerHTML)
        printWindow.document.write("</div></body></html>")
        printWindow.document.close()

        // Wait for content to load before printing
        printWindow.onload = () => {
          printWindow.focus()
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
            setIsGenerating(false)
          }
        }
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Generate invoice number
  const invoiceNumber = `INV-${order.order_number}-${new Date().getTime().toString().slice(-6)}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tax Invoice</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrint} disabled={isGenerating}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={invoiceRef} className="p-6 bg-white">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Retail Bandhu</h1>
              <p className="text-gray-500">Tax Invoice</p>
            </div>

            <div className="flex justify-between mb-6">
              <div>
                <p className="font-bold">Invoice #: {invoiceNumber}</p>
                <p>Order #: {order.order_number}</p>
                <p>Order Date: {formatDate(order.created_at)}</p>
                <p>Invoice Date: {currentDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Status: {order.status.toUpperCase()}</p>
                <p>Payment: {order.payment_status?.toUpperCase() || "PENDING"}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Seller:</h2>
              <p>{order.wholesaler?.business_name || "Wholesaler Business"}</p>
              <p>{order.wholesaler?.name || "Wholesaler Name"}</p>
              <p>{order.wholesaler?.phone_number || "Phone Number"}</p>
              <p>{order.wholesaler?.address || "Address"}</p>
              <p>{order.wholesaler?.pin_code || "PIN Code"}</p>
              <p>GSTIN: {order.wholesaler?.gstin || "Not Available"}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Buyer:</h2>
              <p>{order.retailer?.business_name || "Retailer Business"}</p>
              <p>{order.retailer?.name || "Retailer Name"}</p>
              <p>{order.retailer?.phone_number || "Phone Number"}</p>
              <p>{order.retailer?.address || "Address"}</p>
              <p>{order.retailer?.pin_code || "PIN Code"}</p>
              <p>GSTIN: {order.retailer?.gstin || "Not Available"}</p>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">GST</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.product?.name || `Product ${index + 1}`}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">₹{item.unit_price.toFixed(2)}</td>
                    <td className="text-right py-2">{item.gst_percentage ? `${item.gst_percentage}%` : "N/A"}</td>
                    <td className="text-right py-2">₹{item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right py-2 font-bold">
                    Subtotal:
                  </td>
                  <td className="text-right py-2">
                    ₹{(order.total_amount - order.delivery_charge - (order.delivery_charge_gst || 0)).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right py-2">
                    Delivery Fee:
                  </td>
                  <td className="text-right py-2">₹{order.delivery_charge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right py-2">
                    Delivery GST:
                  </td>
                  <td className="text-right py-2">₹{(order.delivery_charge_gst || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-right py-2 font-bold">
                    Total:
                  </td>
                  <td className="text-right py-2 font-bold">₹{order.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="border-t pt-4">
              <h2 className="text-lg font-bold mb-2">Terms & Conditions:</h2>
              <p>1. Goods once sold will not be taken back or exchanged.</p>
              <p>2. All disputes are subject to local jurisdiction only.</p>
              <p>3. E&OE (Errors and Omissions Excepted).</p>
            </div>

            <div className="mt-8 flex justify-between">
              <div>
                <p className="font-bold">For {order.wholesaler?.business_name || "Wholesaler"}:</p>
                <div className="mt-10 border-t border-dashed w-40">
                  <p className="text-center mt-1">Authorized Signature</p>
                </div>
              </div>
              <div className="text-right">
                <p>This is a computer-generated invoice.</p>
                <p>No signature required.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={isGenerating}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
