import { supabase } from "./supabase-client"

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
