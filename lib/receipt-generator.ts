import { createClient } from "./supabase-client"
import { formatCurrency, formatDate } from "./utils"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export interface ReceiptData {
  paymentId: string
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  paymentDate: string
  paymentStatus: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  wholesalerName?: string
  wholesalerGstin?: string
  retailerGstin?: string
  taxAmount?: number
  deliveryFee?: number
  subtotal?: number
}

export async function generateReceiptPDF(paymentId: string): Promise<{ data: Blob | null; error: any }> {
  try {
    const supabase = createClient()

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      throw paymentError || new Error("Payment not found")
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        retailer:retailer_id(id, name, business_name, gstin, address, city, state, pincode),
        wholesaler:wholesaler_id(id, name, business_name, gstin, address, city, state, pincode),
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          product:product_id(name, description, sku)
        )
      `,
      )
      .eq("id", payment.order_id)
      .single()

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    // Calculate subtotal and tax
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
    const taxRate = 0.18 // 18% GST
    const taxAmount = subtotal * taxRate
    const deliveryFee = 50 // Fixed delivery fee

    // Prepare receipt data
    const receiptData: ReceiptData = {
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      customerName: payment.customer_name,
      customerEmail: payment.customer_email,
      customerPhone: payment.customer_phone,
      paymentMethod:
        payment.gateway === "razorpay"
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
                    : payment.gateway,
      paymentDate: formatDate(payment.created_at),
      paymentStatus: payment.status,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      wholesalerName: order.wholesaler?.business_name || order.wholesaler?.name,
      wholesalerGstin: order.wholesaler?.gstin,
      retailerGstin: order.retailer?.gstin,
      taxAmount,
      deliveryFee,
      subtotal,
    }

    // Generate PDF
    const pdf = generatePDF(receiptData)
    const blob = pdf.output("blob")

    return { data: blob, error: null }
  } catch (error) {
    console.error("Error generating receipt:", error)
    return { data: null, error }
  }
}

function generatePDF(data: ReceiptData): jsPDF {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.width

  // Add logo and title
  pdf.setFontSize(20)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Retail Bandhu", pageWidth / 2, 20, { align: "center" })

  pdf.setFontSize(12)
  pdf.setTextColor(127, 140, 141)
  pdf.text("Payment Receipt", pageWidth / 2, 28, { align: "center" })

  // Add receipt details
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)

  // Left column
  let y = 40
  pdf.text("Receipt #:", 14, y)
  pdf.text(data.paymentId.slice(0, 8).toUpperCase(), 50, y)
  y += 7
  pdf.text("Order #:", 14, y)
  pdf.text(data.orderId.slice(0, 8).toUpperCase(), 50, y)
  y += 7
  pdf.text("Date:", 14, y)
  pdf.text(data.paymentDate, 50, y)
  y += 7
  pdf.text("Payment Method:", 14, y)
  pdf.text(data.paymentMethod, 50, y)
  y += 7
  pdf.text("Status:", 14, y)
  pdf.text(data.paymentStatus.toUpperCase(), 50, y)

  // Right column
  y = 40
  pdf.text("Customer:", 120, y)
  pdf.text(data.customerName, 150, y)
  y += 7
  pdf.text("Email:", 120, y)
  pdf.text(data.customerEmail, 150, y)
  y += 7
  pdf.text("Phone:", 120, y)
  pdf.text(data.customerPhone, 150, y)
  y += 7

  if (data.retailerGstin) {
    pdf.text("GSTIN:", 120, y)
    pdf.text(data.retailerGstin, 150, y)
    y += 7
  }

  // Wholesaler details
  y += 10
  pdf.setFontSize(11)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Wholesaler Details", 14, y)
  y += 7
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text("Name:", 14, y)
  pdf.text(data.wholesalerName || "", 50, y)
  y += 7

  if (data.wholesalerGstin) {
    pdf.text("GSTIN:", 14, y)
    pdf.text(data.wholesalerGstin, 150, y)
    y += 7
  }

  // Items table
  y += 10
  if (data.items && data.items.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [["Item", "Quantity", "Unit Price", "Total"]],
      body: data.items.map((item) => [
        item.name,
        item.quantity.toString(),
        formatCurrency(item.price),
        formatCurrency(item.quantity * item.price),
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14 },
    })

    y = (pdf as any).lastAutoTable.finalY + 10
  }

  // Summary
  pdf.setFontSize(10)
  pdf.text("Subtotal:", 130, y)
  pdf.text(formatCurrency(data.subtotal || 0), 170, y, { align: "right" })
  y += 7

  if (data.taxAmount && data.taxAmount > 0) {
    pdf.text("GST (18%):", 130, y)
    pdf.text(formatCurrency(data.taxAmount), 170, y, { align: "right" })
    y += 7
  }

  if (data.deliveryFee && data.deliveryFee > 0) {
    pdf.text("Delivery Fee:", 130, y)
    pdf.text(formatCurrency(data.deliveryFee), 170, y, { align: "right" })
    y += 7
  }

  pdf.setFontSize(12)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Total Amount:", 130, y)
  pdf.text(formatCurrency(data.amount), 170, y, { align: "right" })

  // Footer
  const footerY = pdf.internal.pageSize.height - 20
  pdf.setFontSize(8)
  pdf.setTextColor(127, 140, 141)
  pdf.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, footerY, {
    align: "center",
  })
  pdf.text("For any queries, please contact support@retailbandhu.com", pageWidth / 2, footerY + 5, {
    align: "center",
  })

  return pdf
}

export async function downloadReceipt(paymentId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: blob, error } = await generateReceiptPDF(paymentId)
    if (error || !blob) {
      throw error || new Error("Failed to generate receipt")
    }

    // Create a download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `receipt-${paymentId.slice(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true, error: null }
  } catch (error) {
    console.error("Error downloading receipt:", error)
    return { success: false, error }
  }
}
