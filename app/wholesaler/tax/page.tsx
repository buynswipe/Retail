"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import {
  FileText,
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  FileCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { getTaxReports, getTaxSummary, generateTaxReport, downloadTaxReport, type TaxReport } from "@/lib/tax-service"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { TemplateSelector } from "@/components/template-selector"
import { getUserTemplatePreference, setUserTemplatePreference } from "@/lib/template-service"
import type { InvoiceTemplateType } from "@/lib/template-service"

function TaxContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reports, setReports] = useState<TaxReport[]>([])
  const [monthlySummary, setMonthlySummary] = useState<any>(null)
  const [quarterlySummary, setQuarterlySummary] = useState<any>(null)
  const [yearlySummary, setYearlySummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportType, setReportType] = useState<"monthly" | "quarterly" | "yearly">("monthly")
  const [previewType, setPreviewType] = useState<"standard" | "detailed" | null>(null)
  const [defaultTemplate, setDefaultTemplate] = useState<InvoiceTemplateType>("standard")

  useEffect(() => {
    if (user) {
      loadReports()
      loadTaxSummaries()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadTemplatePreference()
    }
  }, [user])

  const loadTemplatePreference = async () => {
    if (!user) return

    try {
      const template = await getUserTemplatePreference(user.id)
      setDefaultTemplate(template)
    } catch (error) {
      console.error("Error loading template preference:", error)
    }
  }

  const handleTemplateChange = async (template: InvoiceTemplateType) => {
    if (!user) return

    setDefaultTemplate(template)
    try {
      await setUserTemplatePreference(user.id, template)
    } catch (error) {
      console.error("Error saving template preference:", error)
      toast({
        title: "Error",
        description: "Failed to save template preference. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadReports = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getTaxReports(user.id)
      if (error) {
        console.error("Error loading tax reports:", error)
        toast({
          title: "Error",
          description: "Failed to load tax reports. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setReports(data)
      }
    } catch (error) {
      console.error("Error loading tax reports:", error)
      toast({
        title: "Error",
        description: "Failed to load tax reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTaxSummaries = async () => {
    if (!user) return

    try {
      const { data: monthlyData } = await getTaxSummary(user.id, "wholesaler", "current_month")
      if (monthlyData) {
        setMonthlySummary(monthlyData)
      }

      const { data: quarterlyData } = await getTaxSummary(user.id, "wholesaler", "current_quarter")
      if (quarterlyData) {
        setQuarterlySummary(quarterlyData)
      }

      const { data: yearlyData } = await getTaxSummary(user.id, "wholesaler", "current_year")
      if (yearlyData) {
        setYearlySummary(yearlyData)
      }
    } catch (error) {
      console.error("Error loading tax summaries:", error)
      toast({
        title: "Error",
        description: "Failed to load tax summaries. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateReport = async () => {
    if (!user) return

    setIsGenerating(true)
    try {
      let startDate: Date
      const endDate = new Date()

      const now = new Date()

      switch (reportType) {
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "quarterly":
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data, error } = await generateTaxReport(
        user.id,
        "wholesaler",
        reportType,
        startDate.toISOString(),
        endDate.toISOString(),
      )

      if (error) {
        console.error("Error generating tax report:", error)
        toast({
          title: "Error",
          description: "Failed to generate report. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        toast({
          title: "Success",
          description: "Report generated successfully!",
        })
        loadReports()
      }
    } catch (error) {
      console.error("Error generating tax report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      const { success, url, error } = await downloadTaxReport(reportId)

      if (error) {
        console.error("Error downloading report:", error)
        toast({
          title: "Error",
          description: "Failed to download report. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (success && url) {
        // Create a temporary link element and trigger the download
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `tax-report-${reportId}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Show success message
        toast({
          title: "Success",
          description: "Report download started!",
        })

        // Refresh the reports list to show updated status
        loadReports()
      }
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      })
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
        return <Badge className="bg-blue-500">Generated</Badge>
      case "downloaded":
        return <Badge className="bg-green-500">Downloaded</Badge>
      case "submitted":
        return <Badge className="bg-purple-500">Submitted</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleOpenPreview = (type: "standard" | "detailed") => {
    setPreviewType(type)
  }

  const handleClosePreview = () => {
    setPreviewType(null)
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tax Reports</h1>
        <Button asChild variant="outline">
          <Link href="/wholesaler/dashboard">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="summary">Tax Summary</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* Monthly Summary */}
          {monthlySummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Monthly Tax Summary
                </CardTitle>
                <CardDescription>{monthlySummary.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total Sales</span>
                    <span className="text-2xl font-bold">{formatCurrency(monthlySummary.total_sales)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Tax Collected</span>
                    <span className="text-2xl font-bold">{formatCurrency(monthlySummary.total_tax_collected)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Net Tax Liability</span>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">{formatCurrency(monthlySummary.net_tax_liability)}</span>
                      {monthlySummary.net_tax_liability > 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quarterly Summary */}
          {quarterlySummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Quarterly Tax Summary
                </CardTitle>
                <CardDescription>{quarterlySummary.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total Sales</span>
                    <span className="text-2xl font-bold">{formatCurrency(quarterlySummary.total_sales)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Tax Collected</span>
                    <span className="text-2xl font-bold">{formatCurrency(quarterlySummary.total_tax_collected)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Net Tax Liability</span>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">{formatCurrency(quarterlySummary.net_tax_liability)}</span>
                      {quarterlySummary.net_tax_liability > 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Yearly Summary */}
          {yearlySummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Yearly Tax Summary
                </CardTitle>
                <CardDescription>{yearlySummary.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total Sales</span>
                    <span className="text-2xl font-bold">{formatCurrency(yearlySummary.total_sales)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Tax Collected</span>
                    <span className="text-2xl font-bold">{formatCurrency(yearlySummary.total_tax_collected)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Net Tax Liability</span>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">{formatCurrency(yearlySummary.net_tax_liability)}</span>
                      {yearlySummary.net_tax_liability > 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax Filing Tips */}
          <Card>
            <CardHeader>
              <CardTitle>GST Filing Tips for Wholesalers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>File your GSTR-1 by the 10th of every month</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>File your GSTR-3B by the 20th of every month</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Ensure all your sales invoices have correct GST details</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Maintain proper records of input and output tax</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          {/* Generate Report */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Create a new tax report for your records or GST filing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="quarterly">Quarterly Report</SelectItem>
                      <SelectItem value="yearly">Yearly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Tax Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Loading reports...</p>
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-semibold">
                                  {getReportTypeLabel(report.report_type)} Report
                                </h3>
                                {getStatusBadge(report.status)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">
                                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Tax Report Details</DialogTitle>
                                    <DialogDescription>
                                      {getReportTypeLabel(report.report_type)} Report for{" "}
                                      {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4 py-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-500">Total Sales</h4>
                                      <p className="text-lg font-semibold">{formatCurrency(report.total_sales)}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-500">Tax Collected</h4>
                                      <p className="text-lg font-semibold">
                                        {formatCurrency(report.total_tax_collected)}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-500">Tax Paid</h4>
                                      <p className="text-lg font-semibold">{formatCurrency(report.total_tax_paid)}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-500">Net Tax Liability</h4>
                                      <p className="text-lg font-semibold">
                                        {formatCurrency(report.net_tax_liability)}
                                      </p>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => handleDownloadReport(report.id)}
                                      className="bg-blue-500 hover:bg-blue-600"
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Report
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                onClick={() => handleDownloadReport(report.id)}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 border-t">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-sm text-gray-500">Net Tax:</span>
                                <span className="ml-1 font-medium">{formatCurrency(report.net_tax_liability)}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Generated:</span>
                                <span className="ml-1 font-medium">{formatDate(report.created_at)}</span>
                              </div>
                            </div>
                            <Link
                              href={`/wholesaler/tax/${report.id}`}
                              className="text-sm text-blue-500 flex items-center hover:underline"
                            >
                              Full Report <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No reports found. Generate your first report above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6 mt-6">
          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>GST Invoices</CardTitle>
              <CardDescription>Generate and manage GST invoices for your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">
                  GST invoices are automatically generated for all your orders. You can view and download them from the
                  order details page.
                </p>
                <Button asChild className="bg-blue-500 hover:bg-blue-600">
                  <Link href="/wholesaler/orders">View Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Templates</CardTitle>
              <CardDescription>Choose your default invoice template for all orders</CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateSelector defaultTemplate={defaultTemplate} onTemplateChange={handleTemplateChange} />
            </CardContent>
          </Card>

          {/* GST Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>GST Compliance Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Include your GSTIN on all invoices</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Mention HSN/SAC code for all products</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Show tax breakup (CGST, SGST, IGST) separately</span>
                </li>
                <li className="flex items-start">
                  <FileCheck className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                  <span>Include place of supply for inter-state transactions</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function TaxPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <TaxContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
