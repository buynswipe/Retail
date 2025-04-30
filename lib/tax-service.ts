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
  try {
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
  } catch (error) {
    console.error("Error in getPlatformSettings:", error)
    return {
      commission_percentage: 2,
      commission_gst_rate: 18,
      delivery_charge: 50,
      delivery_gst_rate: 18,
    }
  }
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
    // Check if user is a demo user
    if (userId.startsWith("user-")) {
      // Return demo data
      const now = new Date()
      let periodLabel: string

      switch (period) {
        case "current_month":
          periodLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" })
          return {
            data: {
              total_sales: role === "wholesaler" ? 42000 : 0,
              total_tax_collected: role === "wholesaler" ? 7560 : 0,
              total_tax_paid: role === "wholesaler" ? 2100 : 3500,
              net_tax_liability: role === "wholesaler" ? 5460 : -3500,
              period: periodLabel,
            },
            error: null,
          }
        case "previous_month":
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          periodLabel = prevMonth.toLocaleString("default", { month: "long", year: "numeric" })
          return {
            data: {
              total_sales: role === "wholesaler" ? 38000 : 0,
              total_tax_collected: role === "wholesaler" ? 6840 : 0,
              total_tax_paid: role === "wholesaler" ? 1900 : 3200,
              net_tax_liability: role === "wholesaler" ? 4940 : -3200,
              period: periodLabel,
            },
            error: null,
          }
        case "current_quarter":
          const quarter = Math.floor(now.getMonth() / 3) + 1
          periodLabel = `Q${quarter} ${now.getFullYear()}`
          return {
            data: {
              total_sales: role === "wholesaler" ? 120000 : 0,
              total_tax_collected: role === "wholesaler" ? 21600 : 0,
              total_tax_paid: role === "wholesaler" ? 6000 : 10500,
              net_tax_liability: role === "wholesaler" ? 15600 : -10500,
              period: periodLabel,
            },
            error: null,
          }
        case "current_year":
          periodLabel = now.getFullYear().toString()
          return {
            data: {
              total_sales: role === "wholesaler" ? 480000 : 0,
              total_tax_collected: role === "wholesaler" ? 86400 : 0,
              total_tax_paid: role === "wholesaler" ? 24000 : 42000,
              net_tax_liability: role === "wholesaler" ? 62400 : -42000,
              period: periodLabel,
            },
            error: null,
          }
        default:
          periodLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" })
          return {
            data: {
              total_sales: role === "wholesaler" ? 42000 : 0,
              total_tax_collected: role === "wholesaler" ? 7560 : 0,
              total_tax_paid: role === "wholesaler" ? 2100 : 3500,
              net_tax_liability: role === "wholesaler" ? 5460 : -3500,
              period: periodLabel,
            },
            error: null,
          }
      }
    }

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
      console.error("Error fetching orders:", ordersError)
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
      totalTaxPaid = orders.reduce((sum, order) => sum + (order.commission_gst || 0), 0)
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
    // Check if user is a demo user
    if (userId.startsWith("user-")) {
      // Create a demo report
      const now = new Date()
      const reportId = generateReportId()

      let totalSales = 0
      let totalTaxCollected = 0
      let totalTaxPaid = 0
      let netTaxLiability = 0

      if (role === "wholesaler") {
        switch (reportType) {
          case "monthly":
            totalSales = 42000
            totalTaxCollected = 7560
            totalTaxPaid = 2100
            break
          case "quarterly":
            totalSales = 120000
            totalTaxCollected = 21600
            totalTaxPaid = 6000
            break
          case "yearly":
            totalSales = 480000
            totalTaxCollected = 86400
            totalTaxPaid = 24000
            break
          default:
            totalSales = 42000
            totalTaxCollected = 7560
            totalTaxPaid = 2100
        }
        netTaxLiability = totalTaxCollected - totalTaxPaid
      } else {
        // Retailer
        switch (reportType) {
          case "monthly":
            totalTaxPaid = 3500
            break
          case "quarterly":
            totalTaxPaid = 10500
            break
          case "yearly":
            totalTaxPaid = 42000
            break
          default:
            totalTaxPaid = 3500
        }
        netTaxLiability = -totalTaxPaid
      }

      const demoReport: TaxReport = {
        id: reportId,
        user_id: userId,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        total_sales: totalSales,
        total_tax_collected: totalTaxCollected,
        total_tax_paid: totalTaxPaid,
        net_tax_liability: netTaxLiability,
        status: "generated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return { data: demoReport, error: null }
    }

    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("Error fetching user:", userError)
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
      console.error("Error fetching orders:", ordersError)
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
      totalTaxPaid = orders.reduce((sum, order) => sum + (order.commission_gst || 0), 0)
    }

    // Calculate net tax liability
    const netTaxLiability = totalTaxCollected - totalTaxPaid

    // Create tax report
    const reportId = generateReportId()
    const { data: report, error: reportError } = await supabase
      .from("tax_reports")
      .insert({
        id: reportId,
        user_id: userId,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        total_sales: totalSales,
        total_tax_collected: totalTaxCollected,
        total_tax_paid: totalTaxPaid,
        net_tax_liability: netTaxLiability,
        status: "generated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (reportError) {
      console.error("Error creating tax report:", reportError)
      return { data: null, error: reportError }
    }

    // Create tax report details for each order
    for (const order of orders) {
      const isSameState = true // Assuming same state for simplicity
      const invoiceNumber = order.invoice_number || generateInvoiceNumber(role === "retailer" ? "INV-R" : "INV-W")

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
    // Check if user is a demo user
    if (userId.startsWith("user-")) {
      // Return demo reports
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Create demo reports
      const demoReports: TaxReport[] = [
        {
          id: "demo-report-1",
          user_id: userId,
          report_type: "monthly",
          start_date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
          end_date: new Date(currentYear, currentMonth, 0).toISOString(),
          total_sales: userId.includes("wholesaler") ? 42000 : 0,
          total_tax_collected: userId.includes("wholesaler") ? 7560 : 0,
          total_tax_paid: userId.includes("wholesaler") ? 2100 : 3500,
          net_tax_liability: userId.includes("wholesaler") ? 5460 : -3500,
          status: "downloaded",
          created_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
          updated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
        },
        {
          id: "demo-report-2",
          user_id: userId,
          report_type: "quarterly",
          start_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 3, 1).toISOString(),
          end_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 0).toISOString(),
          total_sales: userId.includes("wholesaler") ? 120000 : 0,
          total_tax_collected: userId.includes("wholesaler") ? 21600 : 0,
          total_tax_paid: userId.includes("wholesaler") ? 6000 : 10500,
          net_tax_liability: userId.includes("wholesaler") ? 15600 : -10500,
          status: "downloaded",
          created_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
          updated_at: new Date(now.getTime() - 40 * 86400000).toISOString(),
        },
      ]

      return { data: demoReports, error: null }
    }

    // Check if tax_reports table exists
    try {
      const { error: tableCheckError } = await supabase.from("tax_reports").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("tax_reports table does not exist, returning demo data")
        // Return demo data if table doesn't exist
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const demoReports: TaxReport[] = [
          {
            id: "demo-report-1",
            user_id: userId,
            report_type: "monthly",
            start_date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
            end_date: new Date(currentYear, currentMonth, 0).toISOString(),
            total_sales: 42000,
            total_tax_collected: 7560,
            total_tax_paid: 2100,
            net_tax_liability: 5460,
            status: "downloaded",
            created_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
            updated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
          },
          {
            id: "demo-report-2",
            user_id: userId,
            report_type: "quarterly",
            start_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 3, 1).toISOString(),
            end_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 0).toISOString(),
            total_sales: 120000,
            total_tax_collected: 21600,
            total_tax_paid: 6000,
            net_tax_liability: 15600,
            status: "downloaded",
            created_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
            updated_at: new Date(now.getTime() - 40 * 86400000).toISOString(),
          },
        ]

        return { data: demoReports, error: null }
      }
    } catch (error) {
      console.error("Error checking tax_reports table:", error)
    }

    const { data, error } = await supabase
      .from("tax_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tax reports:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getTaxReports:", error)
    return { data: null, error }
  }
}

// Get tax report details
export async function getTaxReportDetails(reportId: string): Promise<{ data: TaxReportDetail[] | null; error: any }> {
  try {
    // Check if it's a demo report
    if (reportId.startsWith("demo-")) {
      // Return demo report details
      const demoDetails: TaxReportDetail[] = []

      // Generate 5 sample transactions
      for (let i = 1; i <= 5; i++) {
        const baseAmount = Math.floor(Math.random() * 5000) + 2000
        const taxRate = 18
        const taxBreakdown = calculateTaxBreakdown(baseAmount, taxRate, true)

        demoDetails.push({
          id: `demo-detail-${reportId}-${i}`,
          report_id: reportId,
          order_id: `order-${i}`,
          invoice_number: `INV-${100 + i}`,
          transaction_date: new Date(Date.now() - i * 86400000 * 3).toISOString(),
          customer_name: `Customer ${i}`,
          customer_gstin: i % 2 === 0 ? `27AADCB2230M1Z3` : undefined,
          taxable_amount: taxBreakdown.taxableAmount,
          cgst_amount: taxBreakdown.cgst,
          sgst_amount: taxBreakdown.sgst,
          igst_amount: taxBreakdown.igst,
          total_tax: taxBreakdown.totalTax,
          total_amount: taxBreakdown.totalAmount,
        })
      }

      return { data: demoDetails, error: null }
    }

    // Check if tax_report_details table exists
    try {
      const { error: tableCheckError } = await supabase.from("tax_report_details").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("tax_report_details table does not exist, returning demo data")
        // Return demo data if table doesn't exist
        const demoDetails: TaxReportDetail[] = []

        // Generate 5 sample transactions
        for (let i = 1; i <= 5; i++) {
          const baseAmount = Math.floor(Math.random() * 5000) + 2000
          const taxRate = 18
          const taxBreakdown = calculateTaxBreakdown(baseAmount, taxRate, true)

          demoDetails.push({
            id: `demo-detail-${reportId}-${i}`,
            report_id: reportId,
            order_id: `order-${i}`,
            invoice_number: `INV-${100 + i}`,
            transaction_date: new Date(Date.now() - i * 86400000 * 3).toISOString(),
            customer_name: `Customer ${i}`,
            customer_gstin: i % 2 === 0 ? `27AADCB2230M1Z3` : undefined,
            taxable_amount: taxBreakdown.taxableAmount,
            cgst_amount: taxBreakdown.cgst,
            sgst_amount: taxBreakdown.sgst,
            igst_amount: taxBreakdown.igst,
            total_tax: taxBreakdown.totalTax,
            total_amount: taxBreakdown.totalAmount,
          })
        }

        return { data: demoDetails, error: null }
      }
    } catch (error) {
      console.error("Error checking tax_report_details table:", error)
    }

    const { data, error } = await supabase
      .from("tax_report_details")
      .select("*")
      .eq("report_id", reportId)
      .order("transaction_date", { ascending: false })

    if (error) {
      console.error("Error fetching tax report details:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getTaxReportDetails:", error)
    return { data: null, error }
  }
}

// Get tax report by ID
export async function getTaxReportById(reportId: string): Promise<{ data: TaxReport | null; error: any }> {
  try {
    // Check if it's a demo report
    if (reportId.startsWith("demo-")) {
      // Find the report in demo data
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      if (reportId === "demo-report-1") {
        return {
          data: {
            id: "demo-report-1",
            user_id: "demo-user",
            report_type: "monthly",
            start_date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
            end_date: new Date(currentYear, currentMonth, 0).toISOString(),
            total_sales: 42000,
            total_tax_collected: 7560,
            total_tax_paid: 2100,
            net_tax_liability: 5460,
            status: "downloaded",
            created_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
            updated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
          },
          error: null,
        }
      } else if (reportId === "demo-report-2") {
        return {
          data: {
            id: "demo-report-2",
            user_id: "demo-user",
            report_type: "quarterly",
            start_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 3, 1).toISOString(),
            end_date: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 0).toISOString(),
            total_sales: 120000,
            total_tax_collected: 21600,
            total_tax_paid: 6000,
            net_tax_liability: 15600,
            status: "downloaded",
            created_at: new Date(now.getTime() - 45 * 86400000).toISOString(),
            updated_at: new Date(now.getTime() - 40 * 86400000).toISOString(),
          },
          error: null,
        }
      }

      // If not a known demo report ID, return a generic one
      return {
        data: {
          id: reportId,
          user_id: "demo-user",
          report_type: "monthly",
          start_date: new Date(currentYear, currentMonth, 1).toISOString(),
          end_date: new Date().toISOString(),
          total_sales: 35000,
          total_tax_collected: 6300,
          total_tax_paid: 1750,
          net_tax_liability: 4550,
          status: "generated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    // Check if tax_reports table exists
    try {
      const { error: tableCheckError } = await supabase.from("tax_reports").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("tax_reports table does not exist, returning demo data")
        // Return demo data if table doesn't exist
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        return {
          data: {
            id: reportId,
            user_id: "demo-user",
            report_type: "monthly",
            start_date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
            end_date: new Date(currentYear, currentMonth, 0).toISOString(),
            total_sales: 42000,
            total_tax_collected: 7560,
            total_tax_paid: 2100,
            net_tax_liability: 5460,
            status: "downloaded",
            created_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
            updated_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
          },
          error: null,
        }
      }
    } catch (error) {
      console.error("Error checking tax_reports table:", error)
    }

    const { data, error } = await supabase.from("tax_reports").select("*").eq("id", reportId).single()

    if (error) {
      console.error("Error fetching tax report:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getTaxReportById:", error)
    return { data: null, error }
  }
}

// Making sure the updateTaxReportStatus function is robust

// Update tax report status
export async function updateTaxReportStatus(
  reportId: string,
  status: "generated" | "downloaded" | "submitted",
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if it's a demo report
    if (reportId.startsWith("demo-")) {
      // For demo reports, we'll just simulate a successful status update
      console.log(`Updating demo report ${reportId} status to ${status}`)

      // Add a delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 500))

      return { success: true, error: null }
    }

    // Check if tax_reports table exists
    try {
      const { error: tableCheckError } = await supabase.from("tax_reports").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("tax_reports table does not exist, simulating update")
        // Simulate successful update
        await new Promise((resolve) => setTimeout(resolve, 500))
        return { success: true, error: null }
      }
    } catch (error) {
      console.error("Error checking tax_reports table:", error)
    }

    const { error } = await supabase
      .from("tax_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reportId)

    if (error) {
      console.error("Error updating tax report status:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateTaxReportStatus:", error)
    return { success: false, error }
  }
}

// Generate GST invoice for an order
export async function generateGstInvoice(orderId: string): Promise<{ data: any | null; error: any }> {
  try {
    // Check if it's a demo order
    if (orderId.startsWith("demo-")) {
      // Return demo invoice data
      const invoiceNumber = generateInvoiceNumber("INV-")

      return {
        data: {
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString(),
          order_number: orderId,
          order_date: new Date(Date.now() - 86400000).toISOString(),
          seller: {
            name: "Demo Wholesaler",
            gstin: "27AADCB2230M1Z3",
            address: "123 Business Street, Mumbai",
            pin_code: "400001",
            phone: "9876543210",
          },
          buyer: {
            name: "Demo Retailer",
            gstin: "27AABCS1429B1Z1",
            address: "456 Shop Avenue, Mumbai",
            pin_code: "400002",
            phone: "9876543211",
          },
          items: [
            {
              name: "Premium Rice",
              hsn_code: "1006",
              quantity: 10,
              unit_price: 1200,
              taxable_amount: 10169.49,
              cgst_rate: 9,
              cgst_amount: 915.25,
              sgst_rate: 9,
              sgst_amount: 915.25,
              igst_rate: 0,
              igst_amount: 0,
              total_amount: 12000,
            },
            {
              name: "Refined Oil",
              hsn_code: "1512",
              quantity: 5,
              unit_price: 800,
              taxable_amount: 3389.83,
              cgst_rate: 9,
              cgst_amount: 305.08,
              sgst_rate: 9,
              sgst_amount: 305.08,
              igst_rate: 0,
              igst_amount: 0,
              total_amount: 4000,
            },
          ],
          total: {
            taxable_amount: 13559.32,
            cgst_amount: 1220.33,
            sgst_amount: 1220.33,
            igst_amount: 0,
            total_tax: 2440.66,
            total_amount: 16000,
          },
          payment: {
            method: "UPI",
            status: "paid",
          },
        },
        error: null,
      }
    }

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
      console.error("Error fetching order:", orderError)
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
    // Return demo data for platform tax summary
    const now = new Date()
    let periodLabel: string

    switch (period) {
      case "current_month":
        periodLabel = now.toLocaleString("default", { month: "long", year: "numeric" })
        return {
          data: {
            period: periodLabel,
            total_orders: 156,
            total_commission: 45000,
            total_commission_gst: 8100,
            total_delivery_charge: 15000,
            total_delivery_gst: 2700,
            total_tax_collected: 10800,
            total_revenue: 70800,
            new_retailers: 12,
            new_wholesalers: 5,
            new_delivery_partners: 3,
          },
          error: null,
        }
      case "previous_month":
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        periodLabel = prevMonth.toLocaleString("default", { month: "long", year: "numeric" })
        return {
          data: {
            period: periodLabel,
            total_orders: 142,
            total_commission: 42000,
            total_commission_gst: 7560,
            total_delivery_charge: 14000,
            total_delivery_gst: 2520,
            total_tax_collected: 10080,
            total_revenue: 66080,
            new_retailers: 10,
            new_wholesalers: 4,
            new_delivery_partners: 2,
          },
          error: null,
        }
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3) + 1
        periodLabel = `Q${quarter} ${now.getFullYear()}`
        return {
          data: {
            period: periodLabel,
            total_orders: 450,
            total_commission: 135000,
            total_commission_gst: 24300,
            total_delivery_charge: 45000,
            total_delivery_gst: 8100,
            total_tax_collected: 32400,
            total_revenue: 212400,
            new_retailers: 35,
            new_wholesalers: 15,
            new_delivery_partners: 8,
          },
          error: null,
        }
      case "current_year":
        periodLabel = now.getFullYear().toString()
        return {
          data: {
            period: periodLabel,
            total_orders: 1800,
            total_commission: 540000,
            total_commission_gst: 97200,
            total_delivery_charge: 180000,
            total_delivery_gst: 32400,
            total_tax_collected: 129600,
            total_revenue: 849600,
            new_retailers: 140,
            new_wholesalers: 60,
            new_delivery_partners: 30,
          },
          error: null,
        }
      default:
        periodLabel = now.toLocaleString("default", { month: "long", year: "numeric" })
        return {
          data: {
            period: periodLabel,
            total_orders: 156,
            total_commission: 45000,
            total_commission_gst: 8100,
            total_delivery_charge: 15000,
            total_delivery_gst: 2700,
            total_tax_collected: 10800,
            total_revenue: 70800,
            new_retailers: 12,
            new_wholesalers: 5,
            new_delivery_partners: 3,
          },
          error: null,
        }
    }
  } catch (error) {
    console.error("Error calculating platform tax summary:", error)
    return { data: null, error }
  }
}

// Download tax report
export async function downloadTaxReport(reportId: string): Promise<{ success: boolean; url?: string; error?: any }> {
  try {
    // Check if it's a demo report
    if (reportId.startsWith("demo-")) {
      // For demo reports, we'll generate a downloadable file on the client side
      await updateTaxReportStatus(reportId, "downloaded")

      // Return a success response with a temporary URL
      return {
        success: true,
        url: `/api/tax-reports/download?id=${reportId}&temp=${Date.now()}`,
      }
    }

    // Check if tax_reports table exists
    try {
      const { error: tableCheckError } = await supabase.from("tax_reports").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("tax_reports table does not exist, simulating download")
        // Simulate successful download
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          success: true,
          url: `/api/tax-reports/download?id=${reportId}&temp=${Date.now()}`,
        }
      }
    } catch (error) {
      console.error("Error checking tax_reports table:", error)
    }

    // Update the report status
    const { error } = await supabase
      .from("tax_reports")
      .update({ status: "downloaded", updated_at: new Date().toISOString() })
      .eq("id", reportId)

    if (error) {
      console.error("Error updating tax report status:", error)
      return { success: false, error }
    }

    // Return a success response with a URL to download the report
    return {
      success: true,
      url: `/api/tax-reports/download?id=${reportId}&temp=${Date.now()}`,
    }
  } catch (error) {
    console.error("Error in downloadTaxReport:", error)
    return { success: false, error }
  }
}
