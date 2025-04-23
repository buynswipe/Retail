"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { SalesData } from "@/lib/analytics-service"
import type { SalesForecast } from "@/lib/predictive-analytics-service"
import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SalesForecastCardProps {
  historicalSales: SalesData[]
  forecastData: SalesForecast[]
}

export function SalesForecastCard({ historicalSales, forecastData }: SalesForecastCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format date for chart
  const formatChartData = () => {
    // Format historical data
    const historical = historicalSales.slice(-30).map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      amount: item.amount,
      type: "historical",
    }))

    // Format forecast data
    const forecast = forecastData.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      amount: item.predicted_amount,
      lowerBound: item.lower_bound,
      upperBound: item.upper_bound,
      type: "forecast",
    }))

    return [...historical, ...forecast]
  }

  const chartData = formatChartData()

  // Calculate total forecasted sales
  const totalForecastedSales = forecastData.reduce((sum, item) => sum + item.predicted_amount, 0)

  // Calculate average forecasted daily sales
  const avgForecastedDailySales = totalForecastedSales / forecastData.length

  // Calculate growth compared to historical
  const avgHistoricalDailySales =
    historicalSales.slice(-forecastData.length).reduce((sum, item) => sum + item.amount, 0) / forecastData.length
  const growthPercentage = ((avgForecastedDailySales - avgHistoricalDailySales) / avgHistoricalDailySales) * 100

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Sales Forecast
            <Badge variant="outline" className="ml-2">
              Predictive
            </Badge>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    This forecast is based on historical sales data and uses a predictive algorithm to estimate future
                    sales. The shaded area represents the confidence interval.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Predicted sales for the next {forecastData.length} days</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Forecasted Sales (30 days)</p>
            <p className="text-2xl font-bold">{formatCurrency(totalForecastedSales)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg. Daily Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(avgForecastedDailySales)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Projected Growth</p>
            <p className={`text-2xl font-bold ${growthPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {growthPercentage >= 0 ? "+" : ""}
              {growthPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="h-[300px]">
          <ChartContainer
            config={{
              amount: {
                label: "Sales Amount",
                color: "hsl(var(--chart-1))",
              },
              lowerBound: {
                label: "Lower Bound",
                color: "hsl(var(--chart-2))",
              },
              upperBound: {
                label: "Upper Bound",
                color: "hsl(var(--chart-3))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  strokeWidth={2}
                  fill="url(#colorUpper)"
                  activeDot={{ r: 6 }}
                  name="Sales Amount"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="var(--color-lowerBound)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  fill="transparent"
                  activeDot={false}
                  name="Lower Bound"
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="var(--color-upperBound)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  fill="transparent"
                  activeDot={false}
                  name="Upper Bound"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
