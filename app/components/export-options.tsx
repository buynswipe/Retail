"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import {
  exportSalesDataToCSV,
  exportProductsToCSV,
  exportOrderMetricsToCSV,
  exportCustomerMetricsToCSV,
  exportDeliveryMetricsToCSV,
  exportTaxMetricsToCSV,
  exportSalesDataToPDF,
  exportProductsToPDF,
  exportDashboardToPDF,
} from "@/lib/export-utils"
import type { AnalyticsDashboard, DateRange } from "@/lib/analytics-service"

interface ExportOptionsProps {
  analytics: AnalyticsDashboard
  dateRange: DateRange
  userRole: string
  activeTab: string
}

export function ExportOptions({ analytics, dateRange, userRole, activeTab }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const getDateRangeLabel = (range: DateRange): string => {
    switch (range) {
      case "7d":
        return "Last 7 Days"
      case "30d":
        return "Last 30 Days"
      case "90d":
        return "Last 90 Days"
      case "1y":
        return "Last Year"
      case "all":
        return "All Time"
      case "custom":
        return "Custom Range"
      default:
        return "Last 30 Days"
    }
  }

  const handleExportCSV = (type: string) => {
    setIsExporting(true)

    try {
      switch (type) {
        case "sales":
          exportSalesDataToCSV(analytics.sales_overview.sales_by_date, `sales-data-${userRole}-${dateRange}.csv`)
          break
        case "products":
          exportProductsToCSV(
            analytics.products.top_selling_products,
            `product-performance-${userRole}-${dateRange}.csv`,
          )
          break
        case "orders":
          exportOrderMetricsToCSV(analytics.orders, `order-metrics-${userRole}-${dateRange}.csv`)
          break
        case "customers":
          exportCustomerMetricsToCSV(analytics.customers, `customer-metrics-${userRole}-${dateRange}.csv`)
          break
        case "delivery":
          exportDeliveryMetricsToCSV(analytics.delivery, `delivery-metrics-${userRole}-${dateRange}.csv`)
          break
        case "tax":
          exportTaxMetricsToCSV(analytics.tax, `tax-metrics-${userRole}-${dateRange}.csv`)
          break
        default:
          break
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = (type: string) => {
    setIsExporting(true)

    try {
      switch (type) {
        case "sales":
          exportSalesDataToPDF(
            analytics.sales_overview.sales_by_date,
            analytics.sales_overview.total_sales,
            analytics.sales_overview.sales_growth,
            analytics.sales_overview.average_order_value,
            `sales-report-${userRole}-${dateRange}.pdf`,
          )
          break
        case "products":
          exportProductsToPDF(
            analytics.products.top_selling_products,
            `product-performance-${userRole}-${dateRange}.pdf`,
          )
          break
        case "dashboard":
          exportDashboardToPDF(
            analytics,
            userRole,
            getDateRangeLabel(dateRange),
            `analytics-dashboard-${userRole}-${dateRange}.pdf`,
          )
          break
        default:
          break
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Determine which export options to show based on the active tab
  const getExportOptions = () => {
    const options = []

    // Always include dashboard export
    options.push(
      <DropdownMenuItem key="dashboard-pdf" onClick={() => handleExportPDF("dashboard")}>
        <FileText className="mr-2 h-4 w-4" />
        <span>Full Dashboard as PDF</span>
      </DropdownMenuItem>,
    )

    // Add tab-specific exports
    switch (activeTab) {
      case "overview":
        options.push(
          <DropdownMenuItem key="sales-csv" onClick={() => handleExportCSV("sales")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Sales Data as CSV</span>
          </DropdownMenuItem>,
          <DropdownMenuItem key="sales-pdf" onClick={() => handleExportPDF("sales")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Sales Report as PDF</span>
          </DropdownMenuItem>,
        )
        break
      case "sales":
        options.push(
          <DropdownMenuItem key="sales-csv" onClick={() => handleExportCSV("sales")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Sales Data as CSV</span>
          </DropdownMenuItem>,
          <DropdownMenuItem key="sales-pdf" onClick={() => handleExportPDF("sales")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Sales Report as PDF</span>
          </DropdownMenuItem>,
          <DropdownMenuItem key="orders-csv" onClick={() => handleExportCSV("orders")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Order Metrics as CSV</span>
          </DropdownMenuItem>,
        )
        break
      case "inventory":
        options.push(
          <DropdownMenuItem key="products-csv" onClick={() => handleExportCSV("products")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Product Performance as CSV</span>
          </DropdownMenuItem>,
          <DropdownMenuItem key="products-pdf" onClick={() => handleExportPDF("products")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Product Report as PDF</span>
          </DropdownMenuItem>,
        )
        break
      case "customers":
        options.push(
          <DropdownMenuItem key="customers-csv" onClick={() => handleExportCSV("customers")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Customer Metrics as CSV</span>
          </DropdownMenuItem>,
        )
        break
      case "retailers":
        options.push(
          <DropdownMenuItem key="customers-csv" onClick={() => handleExportCSV("customers")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Retailer Metrics as CSV</span>
          </DropdownMenuItem>,
        )
        break
      case "operations":
      case "performance":
        options.push(
          <DropdownMenuItem key="delivery-csv" onClick={() => handleExportCSV("delivery")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Delivery Metrics as CSV</span>
          </DropdownMenuItem>,
        )
        break
      case "transactions":
        options.push(
          <DropdownMenuItem key="tax-csv" onClick={() => handleExportCSV("tax")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Tax Metrics as CSV</span>
          </DropdownMenuItem>,
        )
        break
      default:
        break
    }

    return options
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {getExportOptions()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
