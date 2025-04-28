import { supabase } from "./supabase-client"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { Order, OrderItem, User } from "./types"

export interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  date: string
  dueDate: string
  customer: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  seller: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  items: {
    name: string
    quantity: number
    price: number
    total: number
  }[]
  subtotal: number
  tax: number
  total: number
  notes: string
}

export async function generateInvoiceData(orderId: string): Promise<{ data: InvoiceData | null; error: any }> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          product:products(*)
        ),
        retailer:users!retailer_id(
          id,
          name,
          business_name,
          address,
          city,
          state,
          pincode,
          phone
        ),
        wholesaler:users!wholesaler_id(
          id,
          name,
          business_name,
          address,
          city,
          state,
          pincode,
          phone
        )
      `,
      )
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      throw orderError || new Error("Order not found")
    }

    // Calculate tax (assuming 18% GST)
    const taxRate = 0.18
    const subtotal = order.total_amount
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Generate invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
      orderNumber: order.id,
      date: new Date().toISOString(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      customer: {
        name: order.retailer.business_name || order.retailer.name,
        address: order.retailer.address || "",
        city: order.retailer.city || "",
        state: order.retailer.state || "",
        pincode: order.retailer.pincode || "",
        phone: order.retailer.phone || "",
      },
      seller: {
        name: order.wholesaler.business_name || order.wholesaler.name,
        address: order.wholesaler.address || "",
        city: order.wholesaler.city || "",
        state: order.wholesaler.state || "",
        pincode: order.wholesaler.pincode || "",
        phone: order.wholesaler.phone || "",
      },
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.subtotal,
      })),
      subtotal,
      tax,
      total,
      notes: "Thank you for your business!",
    }

    return { data: invoiceData, error: null }
  } catch (error) {
    console.error("Error generating invoice data:", error)
    return { data: null, error }
  }
}

// In a real application, you would implement PDF generation here
// For now, we'll just return the invoice data
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<{ url: string | null; error: any }> {
  try {
    // Simulate PDF generation
    console.log("Generating PDF for invoice:", invoiceData.invoiceNumber)

    // In a real application, you would generate a PDF and return its URL
    return {
      url: `https://example.com/invoices/${invoiceData.invoiceNumber}.pdf`,
      error: null,
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return { url: null, error }
  }
}

export async function generateInvoice(order: Order, user: User, items: OrderItem[]): Promise<Blob> {
  return new Promise((resolve) => {
    const doc = new jsPDF()

    // Add company logo/header
    doc.setFontSize(20)
    doc.text("Retail Bandhu", 105, 15, { align: "center" })

    // Add invoice title
    doc.setFontSize(16)
    doc.text("TAX INVOICE", 105, 25, { align: "center" })

    // Add invoice details
    doc.setFontSize(10)
    doc.text(`Invoice Number: INV-${order.id}`, 14, 35)
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`, 14, 40)
    doc.text(`Order ID: ${order.id}`, 14, 45)

    // Add customer details
    doc.text("Bill To:", 14, 55)
    doc.text(`${user.business_name}`, 14, 60)
    doc.text(`${user.address || "Address not provided"}`, 14, 65)
    doc.text(`GSTIN: ${user.gstin || "Not provided"}`, 14, 70)
    doc.text(`Phone: ${user.phone || "Not provided"}`, 14, 75)

    // Add seller details
    doc.text("Seller:", 140, 55)
    doc.text(`${order.wholesaler_name}`, 140, 60)
    doc.text(`${order.wholesaler_address || "Address not provided"}`, 140, 65)
    doc.text(`GSTIN: ${order.wholesaler_gstin || "Not provided"}`, 140, 70)

    // Add items table
    const tableColumn = ["Item", "HSN/SAC", "Qty", "Rate", "Discount", "Taxable Value", "CGST", "SGST", "Total"]
    const tableRows: any[] = []

    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalAmount = 0

    items.forEach((item) => {
      const taxableValue = item.price * item.quantity - (item.discount || 0)
      const cgstAmount = (taxableValue * (item.cgst_rate || 0)) / 100
      const sgstAmount = (taxableValue * (item.sgst_rate || 0)) / 100
      const itemTotal = taxableValue + cgstAmount + sgstAmount

      subtotal += taxableValue
      totalCGST += cgstAmount
      totalSGST += sgstAmount
      totalAmount += itemTotal

      tableRows.push([
        item.product_name,
        item.hsn_code || "N/A",
        item.quantity,
        `₹${item.price.toFixed(2)}`,
        `₹${(item.discount || 0).toFixed(2)}`,
        `₹${taxableValue.toFixed(2)}`,
        `₹${cgstAmount.toFixed(2)} (${item.cgst_rate || 0}%)`,
        `₹${sgstAmount.toFixed(2)} (${item.sgst_rate || 0}%)`,
        `₹${itemTotal.toFixed(2)}`,
      ])
    })

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 85 },
    })

    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY || 150

    // Add summary
    doc.text("Summary:", 14, finalY + 10)
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 14, finalY + 15)
    doc.text(`CGST: ₹${totalCGST.toFixed(2)}`, 14, finalY + 20)
    doc.text(`SGST: ₹${totalSGST.toFixed(2)}`, 14, finalY + 25)
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, finalY + 30)
    doc.text(`Amount in words: ${numberToWords(totalAmount)} Rupees Only`, 14, finalY + 35)

    // Add terms and conditions
    doc.text("Terms & Conditions:", 14, finalY + 45)
    doc.text("1. Goods once sold will not be taken back or exchanged.", 14, finalY + 50)
    doc.text("2. All disputes are subject to local jurisdiction only.", 14, finalY + 55)

    // Add signature
    doc.text("For Retail Bandhu", 150, finalY + 70)
    doc.text("Authorized Signatory", 150, finalY + 80)

    // Add footer
    doc.setFontSize(8)
    doc.text("This is a computer-generated invoice and does not require a physical signature.", 105, 285, {
      align: "center",
    })

    // Convert to blob and resolve
    const pdfBlob = doc.output("blob")
    resolve(pdfBlob)
  })
}

// Helper function to convert number to words
function numberToWords(num: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertLessThanOneThousand(num: number): string {
    if (num === 0) {
      return ""
    }

    if (num < 10) {
      return units[num]
    }

    if (num < 20) {
      return teens[num - 10]
    }

    const ten = Math.floor(num / 10)
    const unit = num % 10

    return tens[ten] + (unit !== 0 ? " " + units[unit] : "")
  }

  if (num === 0) {
    return "Zero"
  }

  // Round to 2 decimal places and convert to string
  const numStr = num.toFixed(2)
  const parts = numStr.split(".")

  let result = ""

  // Process whole number part
  const wholeNum = Number.parseInt(parts[0])

  if (wholeNum >= 10000000) {
    result += convertLessThanOneThousand(Math.floor(wholeNum / 10000000)) + " Crore "
    num %= 10000000
  }

  if (wholeNum >= 100000) {
    result += convertLessThanOneThousand(Math.floor(wholeNum / 100000)) + " Lakh "
    num %= 100000
  }

  if (wholeNum >= 1000) {
    result += convertLessThanOneThousand(Math.floor(wholeNum / 1000)) + " Thousand "
    num %= 1000
  }

  if (wholeNum >= 100) {
    result += convertLessThanOneThousand(Math.floor(wholeNum / 100)) + " Hundred "
    num %= 100
  }

  if (wholeNum > 0) {
    result += convertLessThanOneThousand(wholeNum)
  }

  // Process decimal part
  const decimalPart = Number.parseInt(parts[1])

  if (decimalPart > 0) {
    result += " and " + convertLessThanOneThousand(decimalPart) + " Paise"
  }

  return result.trim()
}
