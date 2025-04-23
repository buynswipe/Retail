"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { type DateRange, getAnalyticsDashboard, type AnalyticsDashboard } from "@/lib/analytics-service"
import { DateRangeSelector } from "@/app/components/date-range-selector"
import { DeliveryMetricsCard } from "@/app/components/delivery-metrics-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function DeliveryAnalyticsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, dateRange, startDate, endDate])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const startDateStr = startDate ? startDate.toISOString().split("T")[0] : undefined
      const endDateStr = endDate ? endDate.toISOString().split("T")[0] : undefined

      const data = await getAnalyticsDashboard(user!.id, user!.role, dateRange, startDateStr, endDateStr)

      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate mock delivery earnings data
  const generateEarningsData = () => {
    const data = []
    const now = new Date()
    let days = 30

    switch (dateRange) {
      case "7d":
        days = 7
        break
      case "30d":
        days = 30
        break
      case "90d":
        days = 90
        break
      default:
        days = 30
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Generate a somewhat realistic earnings pattern
      const baseAmount = Math.floor(Math.random() * 300) + 200

      data.push({
        date: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount: baseAmount,
      })
    }

    return data
  }

  const earningsData = generateEarningsData()
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0)
  const averageEarnings = Math.round(totalEarnings / earningsData.length)

  if (!user) {
    return <div>Please log in to view analytics</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Analytics</h1>
          <p className="text-muted-foreground">Track your delivery performance and earnings</p>
        </div>

        <DateRangeSelector
          dateRange={dateRange}
          setDateRange={setDateRange}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-3 md:col-span-2">
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Your earnings over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">₹{totalEarnings}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Average Daily Earnings</p>
                      <p className="text-2xl font-bold">₹{averageEarnings}</p>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Earnings",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={earningsData}>
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            minTickGap={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) => `₹${value}`}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" name="Earnings" radius={[4, 4, 0, 0]} fill="var(--color-amount)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <DeliveryMetricsCard deliveryMetrics={analytics.delivery} />
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Detailed Earnings</CardTitle>
                  <CardDescription>Breakdown of your earnings by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">₹{totalEarnings}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Average Daily Earnings</p>
                      <p className="text-2xl font-bold">₹{averageEarnings}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                      <p className="text-2xl font-bold">{analytics.delivery.total_deliveries}</p>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Earnings",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={earningsData}>
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            minTickGap={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) => `₹${value}`}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" name="Earnings" radius={[4, 4, 0, 0]} fill="var(--color-amount)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <DeliveryMetricsCard deliveryMetrics={analytics.delivery} />

              <Card className="col-span-3 md:col-span-2">
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>Your delivery efficiency and customer satisfaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">On-time Deliveries</p>
                      <p className="text-2xl font-bold">{analytics.delivery.on_time_deliveries}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Delayed Deliveries</p>
                      <p className="text-2xl font-bold">{analytics.delivery.delayed_deliveries}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Average Delivery Time</p>
                      <p className="text-2xl font-bold">{analytics.delivery.average_delivery_time} hours</p>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        onTime: {
                          label: "On-time",
                          color: "hsl(var(--chart-1))",
                        },
                        delayed: {
                          label: "Delayed",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: "Delivery Status",
                              onTime: analytics.delivery.on_time_deliveries,
                              delayed: analytics.delivery.delayed_deliveries,
                            },
                          ]}
                        >
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="onTime"
                            name="On-time Deliveries"
                            stackId="stack"
                            radius={[4, 0, 0, 4]}
                            fill="var(--color-onTime)"
                          />
                          <Bar
                            dataKey="delayed"
                            name="Delayed Deliveries"
                            stackId="stack"
                            radius={[0, 4, 4, 0]}
                            fill="var(--color-delayed)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
