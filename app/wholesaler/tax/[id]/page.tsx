"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  getTaxReportById,
  getTaxReportDetails,
  updateTaxReportStatus,
  type TaxReport,
  type TaxReportDetail,
} from "@/lib/tax-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

function TaxReportDetailContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const reportId = params.id as string
  const reportContentRef = useRef<HTMLDivElement>(null)

  const [report, setReport] = useState<TaxReport | null>(null)
  const [reportDetails, setReportDetails] = useState<TaxReportDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (user && reportId) {
      loadReportData()
    }
  }, [user, reportId])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const { data: reportData, error: reportError } = await getTaxReportById(reportId)
      if (reportError) {
        console.error("Error loading tax report:", reportError)
        toast({
          title: "Error",
          description: "Failed to load tax report. Please try again.",
          variant: "destructive",
        })
      } else if (reportData) {
        setReport(reportData)
      }

      const { data: detailsData, error: detailsError } = await getTaxReportDetails(reportId)
      if (detailsError) {
        console.error("Error loading tax report details:", detailsError)
        toast({
          title: "Error",
          description: "Failed to load tax report details. Please try again.",
          variant: "destructive",
        })
      } else if (detailsData) {
        setReportDetails(detailsData)
      }
    } catch (error) {
      console.error("Error loading report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!report) return

    setIsDownloading(true)
    try {
      // Update the report status first
      await updateTaxReportStatus(reportId, "downloaded")

      // Generate PDF for download
      const reportHTML = reportContentRef.current?.innerHTML || ""

      // In a real application, we would use a PDF generation library
      // For now, simulate the download by creating a blob
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .report-container { max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { font-weight: bold; background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .mb-4 { margin-bottom: 16px; }
          .mt-4 { margin-top: 16px; }
          .grid { display: grid; grid-gap: 16px; }
          .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
          .rounded-lg { border-radius: 8px; }
          .p-4 { padding: 16px; }
          .bg-gray-50 { background-color: #f9fafb; }
          h1, h2, h3, h4 { margin-top: 0; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
          .card-header { background-color: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb; }
          .card-content { padding: 16px; }
        </style>
      `

      const reportTitle = `${getReportTypeLabel(report.report_type)} Tax Report`
      const reportPeriod = `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`

      // Create simplified HTML content for the download
      const docContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportTitle}</title>
            ${styles}
          </head>
          <body>
            <div class="report-container">
              <h1>${reportTitle}</h1>
              <p>Period: ${reportPeriod}</p>
              
              <div class="card">
                <div class="card-header">
                  <h2>Report Summary</h2>
                </div>
                <div class="card-content">
                  <div class="grid grid-cols-4">
                    <div>
                      <h4>Total Sales</h4>
                      <p class="font-bold">${formatCurrency(report.total_sales)}</p>
                    </div>
                    <div>
                      <h4>Tax Collected</h4>
                      <p class="font-bold">${formatCurrency(report.total_tax_collected)}</p>
                    </div>
                    <div>
                      <h4>Tax Paid</h4>
                      <p class="font-bold">${formatCurrency(report.total_tax_paid)}</p>
                    </div>
                    <div>
                      <h4>Net Tax Liability</h4>
                      <p class="font-bold">${formatCurrency(report.net_tax_liability)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card">
                <div class="card-header">
                  <h2>Transaction Details</h2>
                </div>
                <div class="card-content">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice No.</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>GSTIN</th>
                        <th class="text-right">Taxable Amount</th>
                        <th class="text-right">CGST</th>
                        <th class="text-right">SGST</th>
                        <th class="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${reportDetails
                        .map(
                          (detail) => `
                        <tr>
                          <td>${detail.invoice_number}</td>
                          <td>${formatDate(detail.transaction_date)}</td>
                          <td>${detail.customer_name}</td>
                          <td>${detail.customer_gstin || "N/A"}</td>
                          <td class="text-right">${formatCurrency(detail.taxable_amount)}</td>
                          <td class="text-right">${formatCurrency(detail.cgst_amount)}</td>
                          <td class="text-right">${formatCurrency(detail.sgst_amount)}</td>
                          <td class="text-right">${formatCurrency(detail.total_amount)}</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h3>Net Tax Liability</h3>
                  <span class="font-bold">${formatCurrency(report.net_tax_liability)}</span>
                </div>
                <p>
                  ${
                    report.net_tax_liability > 0
                      ? "Amount to be paid to the government"
                      : "Amount to be claimed as refund or carried forward"
                  }
                </p>
              </div>
              
              <div class="mt-4">
                <p>Report generated on ${formatDate(report.created_at)}</p>
                <p>Downloaded on ${formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </body>
        </html>
      `

      // Create a blob and download it
      const blob = new Blob([docContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportTitle.replace(/\s+/g, "-").toLowerCase()}-${reportId}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show success message
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
        variant: "default",
      })

      // Refresh the data to show updated status
      loadReportData()
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrintReport = () => {
    // Open a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow pop-ups to print the report.",
        variant: "destructive",
      })
      return
    }

    // Get report data
    const reportTitle = report ? `${getReportTypeLabel(report.report_type)} Tax Report` : "Tax Report"
    const reportPeriod = report ? `${formatDate(report.start_date)} - ${formatDate(report.end_date)}` : ""

    // Create print-friendly CSS
    const printCSS = `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            font-size: 12pt;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .branding {
            font-size: 24pt;
            font-weight: bold;
            color: #1a56db;
          }
          .report-title {
            font-size: 20pt;
            margin: 10px 0;
          }
          .report-period {
            font-size: 12pt;
            color: #555;
          }
          .summary-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .summary-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
          }
          .summary-item {
            width: 23%;
            margin-bottom: 10px;
          }
          .summary-label {
            font-size: 10pt;
            color: #555;
          }
          .summary-value {
            font-size: 14pt;
            font-weight: bold;
          }
          .section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            page-break-inside: auto;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th {
            background-color: #f5f5f5;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .text-right {
            text-align: right;
          }
          .liability-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
            border: 1px solid #ddd;
          }
          .liability-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .liability-label {
            font-size: 14pt;
            font-weight: bold;
          }
          .liability-value {
            font-size: 16pt;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            font-size: 10pt;
            color: #555;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        }
      </style>
    `

    // Generate the printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          ${printCSS}
        </head>
        <body>
          <div class="header">
            <div class="branding">Retail Bandhu</div>
            <div class="report-title">${reportTitle}</div>
            <div class="report-period">Period: ${reportPeriod}</div>
          </div>
          
          ${
            report
              ? `
          <div class="summary-section">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Sales</div>
                <div class="summary-value">${formatCurrency(report.total_sales)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Tax Collected</div>
                <div class="summary-value">${formatCurrency(report.total_tax_collected)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Tax Paid</div>
                <div class="summary-value">${formatCurrency(report.total_tax_paid)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Net Tax Liability</div>
                <div class="summary-value">${formatCurrency(report.net_tax_liability)}</div>
              </div>
            </div>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <table>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>GSTIN</th>
                  <th class="text-right">Taxable Amount</th>
                  <th class="text-right">CGST</th>
                  <th class="text-right">SGST</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${reportDetails
                  .map(
                    (detail) => `
                  <tr>
                    <td>${detail.invoice_number}</td>
                    <td>${formatDate(detail.transaction_date)}</td>
                    <td>${detail.customer_name}</td>
                    <td>${detail.customer_gstin || "N/A"}</td>
                    <td class="text-right">${formatCurrency(detail.taxable_amount)}</td>
                    <td class="text-right">${formatCurrency(detail.cgst_amount)}</td>
                    <td class="text-right">${formatCurrency(detail.sgst_amount)}</td>
                    <td class="text-right">${formatCurrency(detail.total_amount)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          ${
            report
              ? `
          <div class="liability-section">
            <div class="liability-row">
              <div class="liability-label">Net Tax Liability</div>
              <div class="liability-value">${formatCurrency(report.net_tax_liability)}</div>
            </div>
            <p>
              ${
                report.net_tax_liability > 0
                  ? "Amount to be paid to the government"
                  : "Amount to be claimed as refund or carried forward"
              }
            </p>
          </div>
          `
              : ""
          }
          
          <div class="footer">
            <p>This report is generated for informational purposes only.</p>
            <p>Please verify all figures before filing your GST returns.</p>
            ${report ? `<p>Report generated on ${formatDate(report.created_at)}</p>` : ""}
            <p>Printed on ${formatDate(new Date().toISOString())}</p>
          </div>
        </body>
      </html>
    `

    // Write to the new window and trigger print
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      // No need to close the window, as it will be handled by the browser after printing
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Monthly"
      case "quarterly":
        return "Quarterly"
      case "yearly":
        return "Yearly"
      case "custom":
        return "Custom"
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading report data...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto max-w-5xl">
        <div className="text-center py-12">
          <p className="text-gray-500">Report not found or you don't have permission to view it.</p>
          <Button asChild className="mt-4">
            <Link href="/wholesaler/tax">Back to Tax Reports</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tax Report</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/wholesaler/tax">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Link>
          </Button>
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="mr-2 h-5 w-5" />
            Print
          </Button>
          <Button onClick={handleDownloadReport} className="bg-blue-500 hover:bg-blue-600" disabled={isDownloading}>
            {isDownloading ? (
              <>
                <span className="mr-2">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>

      <div ref={reportContentRef}>
        {/* Report Header */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>{getReportTypeLabel(report.report_type)} Tax Report</CardTitle>
            <CardDescription>
              Period: {formatDate(report.start_date)} - {formatDate(report.end_date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Sales</h4>
                <p className="text-xl font-semibold">{formatCurrency(report.total_sales)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tax Collected</h4>
                <p className="text-xl font-semibold">{formatCurrency(report.total_tax_collected)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tax Paid</h4>
                <p className="text-xl font-semibold">{formatCurrency(report.total_tax_paid)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Net Tax Liability</h4>
                <p className="text-xl font-semibold">{formatCurrency(report.net_tax_liability)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Details */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead className="text-right">Taxable Amount</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportDetails.length > 0 ? (
                    reportDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell className="font-medium">{detail.invoice_number}</TableCell>
                        <TableCell>{formatDate(detail.transaction_date)}</TableCell>
                        <TableCell>{detail.customer_name}</TableCell>
                        <TableCell>{detail.customer_gstin || "N/A"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.taxable_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.cgst_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.sgst_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.igst_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.total_amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No transaction details found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>Summary for GST Filing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Output Tax</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">CGST Output</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.cgst_amount, 0))}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">SGST Output</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.sgst_amount, 0))}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">IGST Output</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.igst_amount, 0))}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Output Tax</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.total_tax_collected)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Input Tax Credit</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Commission CGST</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.total_tax_paid / 2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Commission SGST</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.total_tax_paid / 2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Commission IGST</TableCell>
                      <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Input Tax</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(report.total_tax_paid)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Net Tax Liability</h3>
                <span className="text-xl font-bold">{formatCurrency(report.net_tax_liability)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {report.net_tax_liability > 0
                  ? "Amount to be paid to the government"
                  : "Amount to be claimed as refund or carried forward"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GSTR-1 Summary */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>GSTR-1 Summary</CardTitle>
            <CardDescription>Use this information to file your GSTR-1 return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold mb-2">B2B Invoices (Table 4)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Invoice Count</TableHead>
                      <TableHead className="text-right">Taxable Value</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportDetails
                      .filter((detail) => detail.customer_gstin)
                      .reduce((acc: any[], detail) => {
                        const existingIndex = acc.findIndex((item) => item.gstin === detail.customer_gstin)
                        if (existingIndex >= 0) {
                          acc[existingIndex].count += 1
                          acc[existingIndex].taxable += detail.taxable_amount
                          acc[existingIndex].igst += detail.igst_amount
                          acc[existingIndex].cgst += detail.cgst_amount
                          acc[existingIndex].sgst += detail.sgst_amount
                        } else {
                          acc.push({
                            gstin: detail.customer_gstin,
                            count: 1,
                            taxable: detail.taxable_amount,
                            igst: detail.igst_amount,
                            cgst: detail.cgst_amount,
                            sgst: detail.sgst_amount,
                          })
                        }
                        return acc
                      }, [])
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.gstin}</TableCell>
                          <TableCell>{item.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.taxable)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.igst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.cgst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.sgst)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">B2C Invoices (Table 5)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Invoice Count</TableHead>
                      <TableHead className="text-right">Taxable Value</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const b2cInvoices = reportDetails.filter((detail) => !detail.customer_gstin)
                      const count = b2cInvoices.length
                      const taxable = b2cInvoices.reduce((sum, detail) => sum + detail.taxable_amount, 0)
                      const igst = b2cInvoices.reduce((sum, detail) => sum + detail.igst_amount, 0)
                      const cgst = b2cInvoices.reduce((sum, detail) => sum + detail.cgst_amount, 0)
                      const sgst = b2cInvoices.reduce((sum, detail) => sum + detail.sgst_amount, 0)

                      return (
                        <TableRow>
                          <TableCell>B2C Small</TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxable)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(igst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cgst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sgst)}</TableCell>
                        </TableRow>
                      )
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mb-6 print:shadow-none">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>This report is generated for informational purposes only.</li>
              <li>Please verify all figures before filing your GST returns.</li>
              <li>For any discrepancies, please contact our support team.</li>
              <li>Report generated on {formatDate(report.created_at)}.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TaxReportDetailPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <TaxReportDetailContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
