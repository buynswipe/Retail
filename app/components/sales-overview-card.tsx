"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SalesData } from "@/lib/analytics-service"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface SalesOverviewCardProps {
  totalSales: number
  salesGrowth: number
  averageOrderValue: number
  salesByDate: SalesData[]
}

export function SalesOverviewCard({ totalSales, salesGrowth, averageOrderValue, salesByDate }: SalesOverviewCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format date for chart
  const formatChartData = (data: SalesData[]) => {
    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      amount: item.amount,
    }))
  }

  const chartData = formatChartData(salesByDate)

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>View your sales performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Growth</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">{salesGrowth}%</p>
              {salesGrowth >= 0 ? (
                <ArrowUpRight className="ml-1 text-green-500" />
              ) : (
                <ArrowDownRight className="ml-1 text-red-500" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ChartContainer
            config={{
              amount: {
                label: "Sales Amount",
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Sales Amount"
                  stroke="var(--color-amount)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
