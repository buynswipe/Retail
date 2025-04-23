"use client"

import { useState, useEffect } from "react"
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

function TaxReportDetailContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<TaxReport | null>(null)
  const [reportDetails, setReportDetails] = useState<TaxReportDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      } else if (reportData) {
        setReport(reportData)
      }

      const { data: detailsData, error: detailsError } = await getTaxReportDetails(reportId)
      if (detailsError) {
        console.error("Error loading tax report details:", detailsError)
      } else if (detailsData) {
        setReportDetails(detailsData)
      }
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      // In a real app, this would download the report
      await updateTaxReportStatus(reportId, "downloaded")
      loadReportData()
      alert("Report downloaded successfully!")
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Failed to download report. Please try again.")
    }
  }

  const handlePrintReport = () => {
    window.print()
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
            <Link href="/retailer/tax">Back to Tax Reports</Link>
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
            <Link href="/retailer/tax">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Link>
          </Button>
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="mr-2 h-5 w-5" />
            Print
          </Button>
          <Button onClick={handleDownloadReport} className="bg-blue-500 hover:bg-blue-600">
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>
        </div>
      </div>

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
                  <TableHead>Supplier</TableHead>
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
                      <TableCell className="text-right">{formatCurrency(detail.taxable_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.cgst_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.sgst_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.igst_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.total_amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
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
              <h3 className="text-lg font-semibold mb-3">Input Tax Credit</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CGST Input</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.cgst_amount, 0))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">SGST Input</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.sgst_amount, 0))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IGST Input</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(reportDetails.reduce((sum, detail) => sum + detail.igst_amount, 0))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Input Tax</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(report.total_tax_paid)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Output Tax</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CGST Output</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">SGST Output</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IGST Output</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Output Tax</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(report.total_tax_collected)}</TableCell>
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
