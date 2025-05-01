"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { getDeliveryAnalytics, getDeliveryPerformance } from "@/lib/delivery-service"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { errorHandler } from "@/lib/error-handler"
import type { DateRange } from "@/lib/types"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function DeliveryAnalytics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any[]>([])

  const { toast } = useToast()

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Format dates for API
      const startDateStr = dateRange.startDate.toISOString()
      const endDateStr = dateRange.endDate.toISOString()

      // Load analytics data
      const { data: analytics, error: analyticsError } = await getDeliveryAnalytics(startDateStr, endDateStr)

      if (analyticsError) {
        throw analyticsError
      }

      if (analytics) {
        setAnalyticsData(analytics)

        // Process data for charts
        processChartData(analytics)
      }

      // Load performance data
      const { data: performance, error: performanceError } = await getDeliveryPerformance()

      if (performanceError) {
        throw performanceError
      }

      if (performance) {
        setPerformanceData(performance)
      }
    } catch (error) {
      errorHandler(error, "Failed to load delivery analytics")
      toast({
        title: "Error",
        description: "Failed to load delivery analytics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processChartData = (data: any) => {
    // Process data for charts if needed
  }

  // Prepare data for status distribution chart
  const prepareStatusData = () => {
    if (!analyticsData) return []

    return [
      { name: "Pending", value: analyticsData.status_counts.pending },
      { name: "Active", value: analyticsData.status_counts.accepted },
      { name: "Completed", value: analyticsData.status_counts.completed },
      { name: "Declined", value: analyticsData.status_counts.declined },
    ]
  }

  // Prepare data for vehicle type chart
  const prepareVehicleData = () => {
    if (!analyticsData) return []

    return [
      { name: "Bike", value: analyticsData.vehicle_type_counts.bike },
      { name: "Van", value: analyticsData.vehicle_type_counts.van },
    ]
  }

  // Prepare data for performance chart
  const preparePerformanceData = () => {
    return performanceData.slice(0, 10).sort((a, b) => a.average_time - b.average_time)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Delivery Analytics</h2>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.total_deliveries || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.status_counts.completed || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analyticsData?.total_delivery_charges.toFixed(2) || "0.00"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total GST</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analyticsData?.total_delivery_gst.toFixed(2) || "0.00"}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Partner Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {prepareStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Vehicle Type Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareVehicleData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {prepareVehicleData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Partner Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Partner Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={preparePerformanceData()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        label={{ value: "Average Delivery Time (minutes)", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis type="category" dataKey="partner_name" width={80} />
                      <Tooltip formatter={(value) => [`${value} minutes`, "Average Time"]} />
                      <Legend />
                      <Bar dataKey="average_time" fill="#8884d8" name="Average Delivery Time (minutes)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Delivery Volume by Partner */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Volume by Partner</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={preparePerformanceData()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="partner_name" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_deliveries" fill="#82ca9d" name="Total Deliveries" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {/* Placeholder for trends - would need time-series data */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">
                      Trend data will be displayed here when more historical data is available.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
