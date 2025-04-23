import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type {
  SalesData,
  ProductPerformance,
  OrderMetrics,
  CustomerMetrics,
  DeliveryMetrics,
  TaxMetrics,
} from "./analytics-service"

// Function to convert data to CSV format
export function convertToCSV(data: any[], headers: string[]): string {
  // Create header row
  let csv = headers.join(",") + "\n"

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header.toLowerCase().replace(/ /g, "_")]
      // Handle values with commas by wrapping in quotes
      return value !== undefined ? `"${value}"` : '""'
    })
    csv += values.join(",") + "\n"
  })

  return csv
}

// Function to download CSV
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to export sales data to CSV
export function exportSalesDataToCSV(salesData: SalesData[], filename = "sales-data.csv"): void {
  const headers = ["Date", "Amount"]
  const formattedData = salesData.map((item) => ({
    date: item.date,
    amount: item.amount,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to export product performance to CSV
export function exportProductsToCSV(products: ProductPerformance[], filename = "product-performance.csv"): void {
  const headers = ["Name", "Total Sales", "Quantity Sold", "Average Rating"]
  const formattedData = products.map((product) => ({
    name: product.name,
    total_sales: product.total_sales,
    quantity_sold: product.quantity_sold,
    average_rating: product.average_rating,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to export order metrics to CSV
export function exportOrderMetricsToCSV(orderMetrics: OrderMetrics, filename = "order-metrics.csv"): void {
  const headers = ["Status", "Count"]
  const formattedData = orderMetrics.order_statuses.map((status) => ({
    status: status.status,
    count: status.count,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to export customer metrics to CSV
export function exportCustomerMetricsToCSV(customerMetrics: CustomerMetrics, filename = "customer-metrics.csv"): void {
  const headers = ["Metric", "Value"]
  const formattedData = [
    { metric: "Total Customers", value: customerMetrics.total_customers },
    { metric: "New Customers", value: customerMetrics.new_customers },
    { metric: "Returning Customers", value: customerMetrics.returning_customers },
    { metric: "Average Order Value", value: customerMetrics.average_order_value },
  ]

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to export delivery metrics to CSV
export function exportDeliveryMetricsToCSV(deliveryMetrics: DeliveryMetrics, filename = "delivery-metrics.csv"): void {
  const headers = ["Metric", "Value"]
  const formattedData = [
    { metric: "Total Deliveries", value: deliveryMetrics.total_deliveries },
    { metric: "On-time Deliveries", value: deliveryMetrics.on_time_deliveries },
    { metric: "Delayed Deliveries", value: deliveryMetrics.delayed_deliveries },
    { metric: "Average Delivery Time (hours)", value: deliveryMetrics.average_delivery_time },
  ]

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to export tax metrics to CSV
export function exportTaxMetricsToCSV(taxMetrics: TaxMetrics, filename = "tax-metrics.csv"): void {
  const headers = ["Category", "Amount"]
  const formattedData = taxMetrics.tax_by_category.map((category) => ({
    category: category.category,
    amount: category.amount,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadCSV(csv, filename)
}

// Function to generate PDF report for sales data
export function exportSalesDataToPDF(
  salesData: SalesData[],
  totalSales: number,
  salesGrowth: number,
  averageOrderValue: number,
  filename = "sales-report.pdf",
): void {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text("Sales Report", 14, 22)

  // Add summary
  doc.setFontSize(12)
  doc.text(`Total Sales: ₹${totalSales.toLocaleString("en-IN")}`, 14, 32)
  doc.text(`Sales Growth: ${salesGrowth}%`, 14, 38)
  doc.text(`Average Order Value: ₹${averageOrderValue.toLocaleString("en-IN")}`, 14, 44)

  // Add date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 52)

  // Add table
  const tableData = salesData.map((item) => [
    new Date(item.date).toLocaleDateString("en-IN"),
    `₹${item.amount.toLocaleString("en-IN")}`,
  ])

  autoTable(doc, {
    head: [["Date", "Amount"]],
    body: tableData,
    startY: 60,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Save the PDF
  doc.save(filename)
}

// Function to generate PDF report for product performance
export function exportProductsToPDF(products: ProductPerformance[], filename = "product-performance-report.pdf"): void {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text("Product Performance Report", 14, 22)

  // Add date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 30)

  // Add table
  const tableData = products.map((product) => [
    product.name,
    `₹${product.total_sales.toLocaleString("en-IN")}`,
    product.quantity_sold.toString(),
    product.average_rating.toFixed(1),
  ])

  autoTable(doc, {
    head: [["Product Name", "Total Sales", "Quantity Sold", "Avg. Rating"]],
    body: tableData,
    startY: 40,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Save the PDF
  doc.save(filename)
}

// Function to generate a comprehensive PDF report
export function exportDashboardToPDF(
  analytics: any,
  role: string,
  dateRange: string,
  filename = "analytics-report.pdf",
): void {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text(`${role.charAt(0).toUpperCase() + role.slice(1)} Analytics Report`, 14, 22)

  // Add date range and generation date
  doc.setFontSize(10)
  doc.text(`Date Range: ${dateRange}`, 14, 30)
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 36)

  // Add sales overview
  doc.setFontSize(14)
  doc.text("Sales Overview", 14, 46)

  doc.setFontSize(10)
  doc.text(`Total Sales: ₹${analytics.sales_overview.total_sales.toLocaleString("en-IN")}`, 14, 54)
  doc.text(`Sales Growth: ${analytics.sales_overview.sales_growth}%`, 14, 60)
  doc.text(`Average Order Value: ₹${analytics.sales_overview.average_order_value.toLocaleString("en-IN")}`, 14, 66)

  // Add order metrics
  doc.setFontSize(14)
  doc.text("Order Metrics", 14, 76)

  doc.setFontSize(10)
  doc.text(`Total Orders: ${analytics.orders.total_orders}`, 14, 84)
  doc.text(`Average Order Value: ₹${analytics.orders.average_order_value.toLocaleString("en-IN")}`, 14, 90)

  // Add order status table
  const orderStatusData = analytics.orders.order_statuses.map((status) => [
    status.status.charAt(0).toUpperCase() + status.status.slice(1),
    status.count.toString(),
  ])

  autoTable(doc, {
    head: [["Status", "Count"]],
    body: orderStatusData,
    startY: 96,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Add new page for product performance
  doc.addPage()

  // Add product performance
  doc.setFontSize(14)
  doc.text("Top Selling Products", 14, 22)

  // Add product table
  const productData = analytics.products.top_selling_products.map((product) => [
    product.name,
    `₹${product.total_sales.toLocaleString("en-IN")}`,
    product.quantity_sold.toString(),
    product.average_rating.toFixed(1),
  ])

  autoTable(doc, {
    head: [["Product Name", "Total Sales", "Quantity Sold", "Avg. Rating"]],
    body: productData,
    startY: 30,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Add customer metrics
  doc.setFontSize(14)
  doc.text("Customer Metrics", 14, doc.autoTable.previous.finalY + 20)

  doc.setFontSize(10)
  const customerY = doc.autoTable.previous.finalY + 28
  doc.text(`Total Customers: ${analytics.customers.total_customers}`, 14, customerY)
  doc.text(`New Customers: ${analytics.customers.new_customers}`, 14, customerY + 6)
  doc.text(`Returning Customers: ${analytics.customers.returning_customers}`, 14, customerY + 12)
  doc.text(
    `Average Order Value: ₹${analytics.customers.average_order_value.toLocaleString("en-IN")}`,
    14,
    customerY + 18,
  )

  // Save the PDF
  doc.save(filename)
}
