import { supabase } from "./supabase-client"

export interface TaxReport {
  id: string
  user_id: string
  report_type: "monthly" | "quarterly" | "yearly" | "custom"
  start_date: string
  end_date: string
  total_sales: number
  total_tax_collected: number
  total_tax_paid: number
  net_tax_liability: number
  status: "generated" | "downloaded" | "submitted"
  created_at: string
  updated_at: string
}

export interface TaxReportDetail {
  id: string
  report_id: string
  order_id: string
  invoice_number: string
  transaction_date: string
  customer_name: string
  customer_gstin?: string
  taxable_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax: number
  total_amount: number
}

export interface TaxSummary {
  total_sales: number
  total_tax_collected: number
  total_tax_paid: number
  net_tax_liability: number
  period: string
}

// Get platform settings for tax rates
async function getPlatformSettings() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .order("effective_from", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching platform settings:", error)
    // Default values if settings can't be fetched
    return {
      commission_percentage: 2,
      commission_gst_rate: 18,
      delivery_charge: 50,
      delivery_gst_rate: 18,
    }
  }

  return data
}

// Generate a unique report ID
function generateReportId(): string {
  const timestamp = new Date().getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `REP${timestamp}${random}`
}

// Generate a unique invoice number
function generateInvoiceNumber(prefix: string): string {
  const timestamp = new Date().getTime().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}${timestamp}${random}`
}

// Calculate tax breakdown for an amount
export function calculateTaxBreakdown(amount: number, taxRate: number, isSameState: boolean) {
  const taxableAmount = (amount * 100) / (100 + taxRate)
  const totalTax = amount - taxableAmount

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (isSameState) {
    // For intra-state transactions, split tax into CGST and SGST
    cgst = totalTax / 2
    sgst = totalTax / 2
  } else {
    // For inter-state transactions, all tax is IGST
    igst = totalTax
  }

  return {
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    totalAmount: amount,
  }
}

// Get tax summary for a user
export async function getTaxSummary(
  userId: string,
  role: "retailer" | "wholesaler",
  period: "current_month" | "previous_month" | "current_quarter" | "current_year",
): Promise<{ data: TaxSummary | null; error: any }> {
  try {
    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    let periodLabel: string

    switch (period) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
        break
      case "previous_month":
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
        break
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        periodLabel = `Q${quarter + 1} ${startDate.getFullYear()}`
        break
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = now.getFullYear().toString()
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
    }

    // Format dates for database query
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // Get orders for the user in the specified period
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq(`${role}_id`, userId)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (ordersError) {
      return { data: null, error: ordersError }
    }

    // Calculate tax summary
    let totalSales = 0
    let totalTaxCollected = 0
    let totalTaxPaid = 0

    if (role === "retailer") {
      // For retailers, they pay tax on purchases
      totalSales = 0
      totalTaxCollected = 0
      totalTaxPaid = orders.reduce((sum, order) => {
        // Calculate GST paid on products
        const orderTotal = order.total_amount
        const settings = { commission_gst_rate: 18, delivery_gst_rate: 18 } // Default values
        const taxRate = 18 // Assuming 18% GST on products
        const taxBreakdown = calculateTaxBreakdown(orderTotal, taxRate, true) // Assuming same state
        return sum + taxBreakdown.totalTax
      }, 0)
    } else if (role === "wholesaler") {
      // For wholesalers, they collect tax on sales and pay tax on platform commission
      totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0)

      // Calculate GST collected on sales
      totalTaxCollected = orders.reduce((sum, order) => {
        const taxRate = 18 // Assuming 18% GST on products
        const taxBreakdown = calculateTaxBreakdown(order.total_amount, taxRate, true) // Assuming same state
        return sum + taxBreakdown.totalTax
      }, 0)

      // Calculate GST paid on platform commission
      totalTaxPaid = orders.reduce((sum, order) => sum + order.commission_gst, 0)
    }

    // Calculate net tax liability
    const netTaxLiability = totalTaxCollected - totalTaxPaid

    return {
      data: {
        total_sales: totalSales,
        total_tax_collected: totalTaxCollected,
        total_tax_paid: totalTaxPaid,
        net_tax_liability: netTaxLiability,
        period: periodLabel,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error calculating tax summary:", error)
    return { data: null, error }
  }
}

// Generate a tax report for a user
export async function generateTaxReport(
  userId: string,
  role: "retailer" | "wholesaler",
  reportType: "monthly" | "quarterly" | "yearly" | "custom",
  startDate: string,
  endDate: string,
): Promise<{ data: TaxReport | null; error: any }> {
  try {
    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      return { data: null, error: userError }
    }

    // Get orders for the user in the specified period
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product:products(id, name, description, image_url, hsn_code, gst_rate)
        ),
        retailer:users!retailer_id(id, name, business_name, phone_number, gst_number),
        wholesaler:users!wholesaler_id(id, name, business_name, phone_number, gst_number)
      `,
      )
      .eq(`${role}_id`, userId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (ordersError) {
      return { data: null, error: ordersError }
    }

    // Calculate tax summary
    let totalSales = 0
    let totalTaxCollected = 0
    let totalTaxPaid = 0

    if (role === "retailer") {
      // For retailers, they pay tax on purchases
      totalSales = 0
      totalTaxCollected = 0
      totalTaxPaid = orders.reduce((sum, order) => {
        // Calculate GST paid on products
        const orderTotal = order.total_amount
        const settings = { commission_gst_rate: 18, delivery_gst_rate: 18 } // Default values
        const taxRate = 18 // Assuming 18% GST on products
        const taxBreakdown = calculateTaxBreakdown(orderTotal, taxRate, true) // Assuming same state
        return sum + taxBreakdown.totalTax
      }, 0)
    } else if (role === "wholesaler") {
      // For wholesalers, they collect tax on sales and pay tax on platform commission
      totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0)

      // Calculate GST collected on sales
      totalTaxCollected = orders.reduce((sum, order) => {
        const taxRate = 18 // Assuming 18% GST on products
        const taxBreakdown = calculateTaxBreakdown(order.total_amount, taxRate, true) // Assuming same state
        return sum + taxBreakdown.totalTax
      }, 0)

      // Calculate GST paid on platform commission
      totalTaxPaid = orders.reduce((sum, order) => sum + order.commission_gst, 0)
    }

    // Calculate net tax liability
    const netTaxLiability = totalTaxCollected - totalTaxPaid

    // Create tax report
    const reportId = generateReportId()
    const { data: report, error: reportError } = await supabase
      .from("tax_reports")
      .insert({
        user_id: userId,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        total_sales: totalSales,
        total_tax_collected: totalTaxCollected,
        total_tax_paid: totalTaxPaid,
        net_tax_liability: netTaxLiability,
        status: "generated",
      })
      .select()
      .single()

    if (reportError) {
      return { data: null, error: reportError }
    }

    // Create tax report details for each order
    for (const order of orders) {
      const isSameState = true // Assuming same state for simplicity
      const invoiceNumber = generateInvoiceNumber(role === "retailer" ? "INV-R" : "INV-W")

      // Calculate tax breakdown
      const taxRate = 18 // Assuming 18% GST on products
      const taxBreakdown = calculateTaxBreakdown(order.total_amount, taxRate, isSameState)

      // Create tax report detail
      await supabase.from("tax_report_details").insert({
        report_id: report.id,
        order_id: order.id,
        invoice_number: invoiceNumber,
        transaction_date: order.created_at,
        customer_name:
          role === "retailer"
            ? order.wholesaler.business_name || order.wholesaler.name
            : order.retailer.business_name || order.retailer.name,
        customer_gstin: role === "retailer" ? order.wholesaler.gst_number : order.retailer.gst_number,
        taxable_amount: taxBreakdown.taxableAmount,
        cgst_amount: taxBreakdown.cgst,
        sgst_amount: taxBreakdown.sgst,
        igst_amount: taxBreakdown.igst,
        total_tax: taxBreakdown.totalTax,
        total_amount: taxBreakdown.totalAmount,
      })
    }

    return { data: report, error: null }
  } catch (error) {
    console.error("Error generating tax report:", error)
    return { data: null, error }
  }
}

// Get tax reports for a user
export async function getTaxReports(userId: string): Promise<{ data: TaxReport[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("tax_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching tax reports:", error)
    return { data: null, error }
  }
}

// Get tax report details
export async function getTaxReportDetails(reportId: string): Promise<{ data: TaxReportDetail[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("tax_report_details")
      .select("*")
      .eq("report_id", reportId)
      .order("transaction_date", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching tax report details:", error)
    return { data: null, error }
  }
}

// Get tax report by ID
export async function getTaxReportById(reportId: string): Promise<{ data: TaxReport | null; error: any }> {
  try {
    const { data, error } = await supabase.from("tax_reports").select("*").eq("id", reportId).single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching tax report:", error)
    return { data: null, error }
  }
}

// Update tax report status
export async function updateTaxReportStatus(
  reportId: string,
  status: "generated" | "downloaded" | "submitted",
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("tax_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reportId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating tax report status:", error)
    return { success: false, error }
  }
}

// Generate GST invoice for an order
export async function generateGstInvoice(orderId: string): Promise<{ data: any | null; error: any }> {
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
          total_price,
          product:products(id, name, description, image_url, hsn_code, gst_rate)
        ),
        retailer:users!retailer_id(id, name, business_name, phone_number, gst_number, address, pin_code),
        wholesaler:users!wholesaler_id(id, name, business_name, phone_number, gst_number, address, pin_code)
      `,
      )
      .eq("id", orderId)
      .single()

    if (orderError) {
      return { data: null, error: orderError }
    }

    // Generate invoice number if not already present
    const invoiceNumber = order.invoice_number || generateInvoiceNumber("INV-")

    // Update order with invoice number if not already present
    if (!order.invoice_number) {
      await supabase.from("orders").update({ invoice_number: invoiceNumber }).eq("id", orderId)
    }

    // Prepare invoice data
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString(),
      order_number: order.order_number,
      order_date: order.created_at,
      seller: {
        name: order.wholesaler.business_name || order.wholesaler.name,
        gstin: order.wholesaler.gst_number,
        address: order.wholesaler.address,
        pin_code: order.wholesaler.pin_code,
        phone: order.wholesaler.phone_number,
      },
      buyer: {
        name: order.retailer.business_name || order.retailer.name,
        gstin: order.retailer.gst_number,
        address: order.retailer.address,
        pin_code: order.retailer.pin_code,
        phone: order.retailer.phone_number,
      },
      items: order.items.map((item: any) => {
        const gstRate = item.product?.gst_rate || 18
        const taxBreakdown = calculateTaxBreakdown(item.total_price, gstRate, true) // Assuming same state

        return {
          name: item.product?.name || "Product",
          hsn_code: item.product?.hsn_code || "N/A",
          quantity: item.quantity,
          unit_price: item.unit_price,
          taxable_amount: taxBreakdown.taxableAmount,
          cgst_rate: gstRate / 2,
          cgst_amount: taxBreakdown.cgst,
          sgst_rate: gstRate / 2,
          sgst_amount: taxBreakdown.sgst,
          igst_rate: 0,
          igst_amount: 0,
          total_amount: item.total_price,
        }
      }),
      total: {
        taxable_amount: order.items.reduce((sum: number, item: any) => {
          const gstRate = item.product?.gst_rate || 18
          const taxBreakdown = calculateTaxBreakdown(item.total_price, gstRate, true)
          return sum + taxBreakdown.taxableAmount
        }, 0),
        cgst_amount: order.items.reduce((sum: number, item: any) => {
          const gstRate = item.product?.gst_rate || 18
          const taxBreakdown = calculateTaxBreakdown(item.total_price, gstRate, true)
          return sum + taxBreakdown.cgst
        }, 0),
        sgst_amount: order.items.reduce((sum: number, item: any) => {
          const gstRate = item.product?.gst_rate || 18
          const taxBreakdown = calculateTaxBreakdown(item.total_price, gstRate, true)
          return sum + taxBreakdown.sgst
        }, 0),
        igst_amount: 0,
        total_tax: order.items.reduce((sum: number, item: any) => {
          const gstRate = item.product?.gst_rate || 18
          const taxBreakdown = calculateTaxBreakdown(item.total_price, gstRate, true)
          return sum + taxBreakdown.totalTax
        }, 0),
        total_amount: order.total_amount,
      },
      payment: {
        method: order.payment_method,
        status: order.payment_status,
      },
    }

    return { data: invoiceData, error: null }
  } catch (error) {
    console.error("Error generating GST invoice:", error)
    return { data: null, error }
  }
}

// Get platform tax summary for admin
export async function getPlatformTaxSummary(
  period: "current_month" | "previous_month" | "current_quarter" | "current_year",
): Promise<{ data: any | null; error: any }> {
  try {
    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    let periodLabel: string

    switch (period) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
        break
      case "previous_month":
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
        break
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        periodLabel = `Q${quarter + 1} ${startDate.getFullYear()}`
        break
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = now.getFullYear().toString()
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`
    }

    // Format dates for database query
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // Get all orders in the specified period
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    if (ordersError) {
      return { data: null, error: ordersError }
    }

    // Calculate platform tax summary
    const totalCommission = orders.reduce((sum, order) => sum + order.commission, 0)
    const totalCommissionGst = orders.reduce((sum, order) => sum + order.commission_gst, 0)
    const totalDeliveryCharge = orders.reduce((sum, order) => sum + order.delivery_charge, 0)
    const totalDeliveryGst = orders.reduce((sum, order) => sum + order.delivery_charge_gst, 0)

    const totalTaxCollected = totalCommissionGst + totalDeliveryGst
    const totalRevenue = totalCommission + totalCommissionGst + totalDeliveryCharge + totalDeliveryGst

    // Get user counts
    const { data: retailerCount, error: retailerError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "retailer")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    const { data: wholesalerCount, error: wholesalerError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "wholesaler")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    const { data: deliveryCount, error: deliveryError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "delivery")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)

    return {
      data: {
        period: periodLabel,
        total_orders: orders.length,
        total_commission: totalCommission,
        total_commission_gst: totalCommissionGst,
        total_delivery_charge: totalDeliveryCharge,
        total_delivery_gst: totalDeliveryGst,
        total_tax_collected: totalTaxCollected,
        total_revenue: totalRevenue,
        new_retailers: retailerCount,
        new_wholesalers: wholesalerCount,
        new_delivery_partners: deliveryCount,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error calculating platform tax summary:", error)
    return { data: null, error }
  }
}
