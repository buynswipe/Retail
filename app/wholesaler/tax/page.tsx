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
  Printer,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
  getTaxReports,
  getTaxSummary,
  generateTaxReport,
  updateTaxReportStatus,
  type TaxReport,
} from "@/lib/tax-service"
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
import { supabase } from "@/lib/supabase-client"

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
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    if (user) {
      checkTableExists()
      loadReports()
      loadTaxSummaries()
    }
  }, [user])

  const checkTableExists = async () => {
    try {
      const { error } = await supabase.from("tax_reports").select("id").limit(1)

      if (error && error.message.includes("does not exist")) {
        console.log("Tax reports table doesn't exist")
        setTableExists(false)
      } else {
        setTableExists(true)
      }
    } catch (error) {
      console.error("Error checking tax_reports table:", error)
      setTableExists(false)
    }
  }

  const loadReports = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // If user is a demo user or table doesn't exist, use demo data
      if (user.id.startsWith("user-") || !tableExists) {
        console.log("Using demo tax reports")
        const demoReports = [
          {
            id: "demo-report-1",
            user_id: user.id,
            report_type: "monthly",
            start_date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString(),
            end_date: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString(),
            total_sales: 125000,
            total_tax_collected: 22500,
            total_tax_paid: 6000,
            net_tax_liability: 16500,
            status: "generated",
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
          {
            id: "demo-report-2",
            user_id: user.id,
            report_type: "quarterly",
            start_date: new Date(
              new Date().getFullYear(),
              Math.floor((new Date().getMonth() - 3) / 3) * 3,
              1,
            ).toISOString(),
            end_date: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 0).toISOString(),
            total_sales: 350000,
            total_tax_collected: 63000,
            total_tax_paid: 17500,
            net_tax_liability: 45500,
            status: "downloaded",
            created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
            updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
          },
        ]
        setReports(demoReports)
        setIsLoading(false)
        return
      }

      const { data, error } = await getTaxReports(user.id)
      if (error) {
        console.error("Error loading tax reports:", error)
      } else if (data) {
        setReports(data)
      }
    } catch (error) {
      console.error("Error loading tax reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTaxSummaries = async () => {
    if (!user) return

    try {
      // If user is a demo user or table doesn't exist, use demo data
      if (user.id.startsWith("user-") || !tableExists) {
        console.log("Using demo tax summaries")

        // Monthly summary
        setMonthlySummary({
          period: format(new Date(), "MMMM yyyy"),
          total_sales: 42000,
          total_tax_collected: 7560,
          total_tax_paid: 2100,
          net_tax_liability: 5460,
        })

        // Quarterly summary
        setQuarterlySummary({
          period: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
          total_sales: 120000,
          total_tax_collected: 21600,
          total_tax_paid: 6000,
          net_tax_liability: 15600,
        })

        // Yearly summary
        setYearlySummary({
          period: new Date().getFullYear().toString(),
          total_sales: 480000,
          total_tax_collected: 86400,
          total_tax_paid: 24000,
          net_tax_liability: 62400,
        })

        return
      }

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
    }
  }

  const handleGenerateReport = async () => {
    if (!user) return

    setIsGenerating(true)
    try {
      // If user is a demo user or table doesn't exist, simulate report generation
      if (user.id.startsWith("user-") || !tableExists) {
        console.log("Simulating tax report generation")

        // Wait a bit to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create a new demo report
        const now = new Date()
        let startDate: Date
        const endDate = now
        let reportName: string

        switch (reportType) {
          case "monthly":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            reportName = "Monthly"
            break
          case "quarterly":
            const quarter = Math.floor(now.getMonth() / 3)
            startDate = new Date(now.getFullYear(), quarter * 3, 1)
            reportName = "Quarterly"
            break
          case "yearly":
            startDate = new Date(now.getFullYear(), 0, 1)
            reportName = "Yearly"
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            reportName = "Monthly"
        }

        const newReport: TaxReport = {
          id: `demo-report-${Date.now()}`,
          user_id: user.id,
          report_type: reportType,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_sales: Math.floor(Math.random() * 50000) + 30000,
          total_tax_collected: Math.floor(Math.random() * 9000) + 5000,
          total_tax_paid: Math.floor(Math.random() * 3000) + 1000,
          net_tax_liability: Math.floor(Math.random() * 6000) + 4000,
          status: "generated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setReports((prev) => [newReport, ...prev])

        alert(`${reportName} report generated successfully!`)
        setIsGenerating(false)
        return
      }

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
        alert("Failed to generate report. Please try again.")
      } else if (data) {
        alert("Report generated successfully!")
        loadReports()
      }
    } catch (error) {
      console.error("Error generating tax report:", error)
      alert("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      // If user is a demo user or table doesn't exist, simulate download
      if (user?.id.startsWith("user-") || !tableExists) {
        console.log("Simulating tax report download")

        // Wait a bit to simulate processing
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Update the report status in our local state
        setReports((prev) =>
          prev.map((report) =>
            report.id === reportId ? { ...report, status: "downloaded", updated_at: new Date().toISOString() } : report,
          ),
        )

        alert("Report downloaded successfully!")
        return
      }

      // In a real app, this would download the report
      await updateTaxReportStatus(reportId, "downloaded")
      loadReports()
      alert("Report downloaded successfully!")
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Failed to download report. Please try again.")
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Standard GST Invoice</h3>
                        <p className="text-sm text-gray-500">Default template for all orders</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Detailed Tax Invoice</h3>
                        <p className="text-sm text-gray-500">With HSN codes and tax breakup</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
