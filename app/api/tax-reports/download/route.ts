import { type NextRequest, NextResponse } from "next/server"
import { getTaxReportById, getTaxReportDetails } from "@/lib/tax-service"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    // Get the report ID from the query parameters
    const searchParams = request.nextUrl.searchParams
    const reportId = searchParams.get("id")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    // Get the report data
    const { data: report, error: reportError } = await getTaxReportById(reportId)
    if (reportError || !report) {
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }

    // Get the report details
    const { data: reportDetails, error: detailsError } = await getTaxReportDetails(reportId)
    if (detailsError) {
      return NextResponse.json({ error: "Failed to fetch report details" }, { status: 500 })
    }

    // Format the report data as CSV
    const csvData = generateCsvData(report, reportDetails || [])

    // Set the headers for a CSV download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", `attachment; filename="tax-report-${reportId}.csv"`)

    // Return the CSV data
    return new NextResponse(csvData, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error downloading report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCsvData(report: any, details: any[]) {
  // Format dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy")
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2)
  }

  // Generate CSV header
  let csv = "Tax Report\n"
  csv += `Report Type,${report.report_type}\n`
  csv += `Period,${formatDate(report.start_date)} - ${formatDate(report.end_date)}\n`
  csv += `Generated On,${formatDate(report.created_at)}\n\n`

  // Summary section
  csv += "Summary\n"
  csv += `Total Sales,${formatCurrency(report.total_sales)}\n`
  csv += `Total Tax Collected,${formatCurrency(report.total_tax_collected)}\n`
  csv += `Total Tax Paid,${formatCurrency(report.total_tax_paid)}\n`
  csv += `Net Tax Liability,${formatCurrency(report.net_tax_liability)}\n\n`

  // Details section
  if (details && details.length > 0) {
    csv += "Transaction Details\n"
    csv += "Invoice No.,Date,Customer,GSTIN,Taxable Amount,CGST,SGST,IGST,Total\n"

    details.forEach((detail) => {
      csv += `${detail.invoice_number},`
      csv += `${formatDate(detail.transaction_date)},`
      csv += `${detail.customer_name},`
      csv += `${detail.customer_gstin || "N/A"},`
      csv += `${formatCurrency(detail.taxable_amount)},`
      csv += `${formatCurrency(detail.cgst_amount)},`
      csv += `${formatCurrency(detail.sgst_amount)},`
      csv += `${formatCurrency(detail.igst_amount)},`
      csv += `${formatCurrency(detail.total_amount)}\n`
    })
  }

  return csv
}
