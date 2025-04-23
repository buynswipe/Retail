"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CustomerMetrics } from "@/lib/analytics-service"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CustomerMetricsCardProps {
  customerMetrics: CustomerMetrics
}

export function CustomerMetricsCard({ customerMetrics }: CustomerMetricsCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Prepare chart data
  const chartData = [
    {
      name: "New Customers",
      value: customerMetrics.new_customers,
    },
    {
      name: "Returning Customers",
      value: customerMetrics.returning_customers,
    },
  ]

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle>Customer Metrics</CardTitle>
        <CardDescription>Overview of your customer base</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold">{customerMetrics.total_customers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(customerMetrics.average_order_value)}</p>
          </div>
        </div>

        <div className="h-[200px] flex items-center justify-center">
          <ChartContainer
            config={{
              "New Customers": {
                label: "New Customers",
                color: "hsl(var(--chart-1))",
              },
              "Returning Customers": {
                label: "Returning Customers",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell key="new" fill="var(--color-New Customers)" />
                  <Cell key="returning" fill="var(--color-Returning Customers)" />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="flex justify-center mt-4 space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))] mr-2" />
            <span className="text-sm">New ({customerMetrics.new_customers})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))] mr-2" />
            <span className="text-sm">Returning ({customerMetrics.returning_customers})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
