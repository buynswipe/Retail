"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import Link from "next/link"

export default function InventoryReportsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reports, setReports] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    topProducts: [],
    recentMovements: [],
  })
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const [dateRange, setDateRange] = useState("30")
  const [movementType, setMovementType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadReports = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // In a real app, these would be actual API calls
        // For now, we'll simulate the data
        const mockReports = {
          totalProducts: 156,
          totalValue: 245600,
          lowStockCount: 12,
          expiringCount: 8,
          topProducts: [
            { id: "1", name: "Rice (5kg)", stock: 120, value: 12000, category: "Grains" },
            { id: "2", name: "Wheat Flour", stock: 85, value: 8500, category: "Flour" },
            { id: "3", name: "Cooking Oil (1L)", stock: 65, value: 9750, category: "Oils" },
            { id: "4", name: "Sugar (1kg)", stock: 110, value: 5500, category: "Sugar" },
            { id: "5", name: "Dal (2kg)", stock: 75, value: 11250, category: "Pulses" },
          ],
          recentMovements: [
            {
              id: "m1",
              product: "Rice (5kg)",
              type: "increase",
              quantity: 50,
              date: "2023-06-15",
              reason: "New stock",
            },
            {
              id: "m2",
              product: "Cooking Oil (1L)",
              type: "decrease",
              quantity: 10,
              date: "2023-06-14",
              reason: "Order #12345",
            },
            {
              id: "m3",
              product: "Wheat Flour",
              type: "increase",
              quantity: 30,
              date: "2023-06-12",
              reason: "New stock",
            },
            {
              id: "m4",
              product: "Sugar (1kg)",
              type: "decrease",
              quantity: 15,
              date: "2023-06-10",
              reason: "Order #12340",
            },
            {
              id: "m5",
              product: "Dal (2kg)",
              type: "decrease",
              quantity: 5,
              date: "2023-06-09",
              reason: "Order #12338",
            },
          ],
        }

        setReports(mockReports)

        // Generate mock movements data
        const mockMovements = []
        for (let i = 0; i < 50; i++) {
          const isIncrease = Math.random() > 0.5
          mockMovements.push({
            id: `mov${i}`,
            product: ["Rice (5kg)", "Wheat Flour", "Cooking Oil (1L)", "Sugar (1kg)", "Dal (2kg)"][
              Math.floor(Math.random() * 5)
            ],
            type: isIncrease ? "increase" : "decrease",
            quantity: Math.floor(Math.random() * 50) + 1,
            date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            reason: isIncrease ? "New stock" : `Order #${Math.floor(Math.random() * 10000) + 10000}`,
          })
        }
        setMovements(mockMovements)
      } catch (error) {
        console.error("Failed to load inventory reports:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory reports. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [user])

  // Filter movements based on search query, date range, and movement type
  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = movement.product.toLowerCase().includes(searchQuery.toLowerCase())

    const movementDate = new Date(movement.date)
    const daysAgo = (Date.now() - movementDate.getTime()) / (1000 * 60 * 60 * 24)
    const matchesDateRange = dateRange === "all" || daysAgo <= Number.parseInt(dateRange)

    const matchesType = movementType === "all" || movement.type === movementType

    return matchesSearch && matchesDateRange && matchesType
  })

  // Sort movements by date (newest first)
  filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    })

    // In a real app, this would trigger an actual CSV download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your report has been downloaded successfully.",
      })
    }, 2000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Button variant="outline" asChild className="mb-2">
                <Link href="/wholesaler/inventory/dashboard">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("Back to Dashboard")}
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">{t("Inventory Reports")}</h1>
              <p className="text-gray-500">{t("View detailed reports about your inventory")}</p>
            </div>
            <Button onClick={handleExportCSV}>
              <Download className="mr-2 h-5 w-5" />
              {t("Export CSV")}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="summary" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("Summary")}
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("Stock Movements")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "summary" ? (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t("Total Products")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.totalProducts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t("Total Inventory Value")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(reports.totalValue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t("Low Stock Items")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.lowStockCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t("Expiring Soon")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.expiringCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    {t("Top Products by Value")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">{t("Product")}</th>
                          <th className="text-left py-3 px-4">{t("Category")}</th>
                          <th className="text-right py-3 px-4">{t("Stock")}</th>
                          <th className="text-right py-3 px-4">{t("Value")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.topProducts.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{product.name}</td>
                            <td className="py-3 px-4">{product.category}</td>
                            <td className="py-3 px-4 text-right">{product.stock}</td>
                            <td className="py-3 px-4 text-right font-medium">{formatCurrency(product.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Movements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {t("Recent Stock Movements")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">{t("Date")}</th>
                          <th className="text-left py-3 px-4">{t("Product")}</th>
                          <th className="text-left py-3 px-4">{t("Type")}</th>
                          <th className="text-right py-3 px-4">{t("Quantity")}</th>
                          <th className="text-left py-3 px-4">{t("Reason")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.recentMovements.map((movement) => (
                          <tr key={movement.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{formatDate(movement.date)}</td>
                            <td className="py-3 px-4">{movement.product}</td>
                            <td className="py-3 px-4">
                              {movement.type === "increase" ? (
                                <span className="flex items-center text-green-600">
                                  <ArrowUpRight className="h-4 w-4 mr-1" />
                                  {t("In")}
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <ArrowDownRight className="h-4 w-4 mr-1" />
                                  {t("Out")}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">{movement.quantity}</td>
                            <td className="py-3 px-4">{movement.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t("Search products...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-12 w-full md:w-[180px]">
                      <SelectValue placeholder={t("Date Range")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">{t("Last 7 days")}</SelectItem>
                      <SelectItem value="30">{t("Last 30 days")}</SelectItem>
                      <SelectItem value="90">{t("Last 90 days")}</SelectItem>
                      <SelectItem value="all">{t("All time")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger className="h-12 w-full md:w-[180px]">
                      <SelectValue placeholder={t("Movement Type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All Types")}</SelectItem>
                      <SelectItem value="increase">{t("Stock In")}</SelectItem>
                      <SelectItem value="decrease">{t("Stock Out")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Movements Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 px-6">{t("Date")}</th>
                          <th className="text-left py-4 px-6">{t("Product")}</th>
                          <th className="text-left py-4 px-6">{t("Type")}</th>
                          <th className="text-right py-4 px-6">{t("Quantity")}</th>
                          <th className="text-left py-4 px-6">{t("Reason")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovements.map((movement) => (
                          <tr key={movement.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-6">{formatDate(movement.date)}</td>
                            <td className="py-4 px-6">{movement.product}</td>
                            <td className="py-4 px-6">
                              {movement.type === "increase" ? (
                                <span className="flex items-center text-green-600">
                                  <ArrowUpRight className="h-4 w-4 mr-1" />
                                  {t("In")}
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <ArrowDownRight className="h-4 w-4 mr-1" />
                                  {t("Out")}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">{movement.quantity}</td>
                            <td className="py-4 px-6">{movement.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredMovements.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-lg text-gray-500">{t("No stock movements found matching your filters")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
