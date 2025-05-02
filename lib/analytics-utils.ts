import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns"
import Papa from "papaparse"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Date range types
export type DateRange = {
  startDate: Date
  endDate: Date
}

export type PredefinedRange = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "custom"

// Get date range from predefined range
export function getDateRangeFromPredefined(range: PredefinedRange, customRange?: DateRange): DateRange {
  const today = new Date()

  switch (range) {
    case "today":
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      }
    case "yesterday":
      const yesterday = subDays(today, 1)
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      }
    case "last7days":
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
      }
    case "last30days":
      return {
        startDate: startOfDay(subDays(today, 29)),
        endDate: endOfDay(today),
      }
    case "thisMonth":
      return {
        startDate: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: endOfDay(today),
      }
    case "lastMonth":
      return {
        startDate: startOfDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        endDate: endOfDay(new Date(today.getFullYear(), today.getMonth(), 0)),
      }
    case "custom":
      if (!customRange) {
        throw new Error("Custom range must be provided when using 'custom' range type")
      }
      return customRange
    default:
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
      }
  }
}

// Format date range for display
export function formatDateRange(range: DateRange): string {
  return `${format(range.startDate, "MMM d, yyyy")} - ${format(range.endDate, "MMM d, yyyy")}`
}

// Convert date range to Supabase filter
export function dateRangeToSupabaseFilter(range: DateRange): string {
  const startDateStr = format(range.startDate, "yyyy-MM-dd")
  const endDateStr = format(range.endDate, "yyyy-MM-dd")
  return `created_at >= '${startDateStr}' AND created_at <= '${endDateStr} 23:59:59'`
}

// Export data to CSV
export function exportToCSV(data: any[], filename: string): void {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export data to PDF
export function exportToPDF(
  data: any[],
  columns: { key: string; title: string }[],
  title: string,
  filename: string,
): void {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text(title, 14, 22)

  // Add date
  doc.setFontSize(11)
  doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy")}`, 14, 30)

  // Prepare table data
  const tableColumn = columns.map((col) => col.title)
  const tableRows = data.map((item) => columns.map((col) => item[col.key]))

  // Add table
  ;(doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  // Save PDF
  doc.save(`${filename}.pdf`)
}

// Simple linear regression for forecasting
export function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length

  // Calculate means
  const xMean = data.reduce((sum, point) => sum + point.x, 0) / n
  const yMean = data.reduce((sum, point) => sum + point.y, 0) / n

  // Calculate slope
  const numerator = data.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0)
  const denominator = data.reduce((sum, point) => sum + Math.pow(point.x - xMean, 2), 0)

  const slope = numerator / denominator
  const intercept = yMean - slope * xMean

  return { slope, intercept }
}

// Generate forecast data
export function generateForecast(
  historicalData: { date: string; value: number }[],
  daysToForecast: number,
): { date: string; value: number; isForecast: boolean }[] {
  // Convert historical data for regression
  const regressionData = historicalData.map((point, index) => ({
    x: index,
    y: point.value,
  }))

  // Calculate regression
  const { slope, intercept } = linearRegression(regressionData)

  // Generate forecast dates
  const lastDate = parseISO(historicalData[historicalData.length - 1].date)
  const forecastDates = Array.from({ length: daysToForecast }, (_, i) => {
    const date = new Date(lastDate)
    date.setDate(date.getDate() + i + 1)
    return format(date, "yyyy-MM-dd")
  })

  // Generate forecast values
  const forecastData = forecastDates.map((date, index) => {
    const x = regressionData.length + index
    const forecastValue = slope * x + intercept
    return {
      date,
      value: Math.max(0, Math.round(forecastValue)), // Ensure non-negative values
      isForecast: true,
    }
  })

  // Combine historical and forecast data
  return [...historicalData.map((point) => ({ ...point, isForecast: false })), ...forecastData]
}

// Generate product recommendations based on purchase patterns
export function generateProductRecommendations(
  purchaseData: { productId: string; productName: string; categoryId: string; quantity: number }[],
): { productId: string; productName: string; score: number }[] {
  // Group products by category
  const productsByCategory: Record<string, { productId: string; productName: string; quantity: number }[]> = {}

  purchaseData.forEach((item) => {
    if (!productsByCategory[item.categoryId]) {
      productsByCategory[item.categoryId] = []
    }

    const existingProduct = productsByCategory[item.categoryId].find((p) => p.productId === item.productId)

    if (existingProduct) {
      existingProduct.quantity += item.quantity
    } else {
      productsByCategory[item.categoryId].push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      })
    }
  })

  // Calculate popularity score within each category
  const recommendations: { productId: string; productName: string; score: number }[] = []

  Object.values(productsByCategory).forEach((products) => {
    // Sort products by quantity in descending order
    const sortedProducts = [...products].sort((a, b) => b.quantity - a.quantity)

    // Calculate total quantity for the category
    const totalQuantity = sortedProducts.reduce((sum, product) => sum + product.quantity, 0)

    // Add top products to recommendations with a score
    sortedProducts.slice(0, 3).forEach((product) => {
      recommendations.push({
        productId: product.productId,
        productName: product.productName,
        score: (product.quantity / totalQuantity) * 100,
      })
    })
  })

  // Sort recommendations by score in descending order
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5)
}
