"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderMetrics } from "@/lib/analytics-service"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface OrderMetricsCardProps {
  orderMetrics: OrderMetrics
}

export function OrderMetricsCard({ orderMetrics }: OrderMetricsCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Prepare chart data
  const chartData = orderMetrics.order_statuses.map((item) => ({
    status: formatStatus(item.status),
    count: item.count,
  }))

  // Define colors for different statuses
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed":
        return "hsl(var(--chart-1))"
      case "confirmed":
        return "hsl(var(--chart-2))"
      case "dispatched":
        return "hsl(var(--chart-3))"
      case "delivered":
        return "hsl(var(--chart-4))"
      case "cancelled":
        return "hsl(var(--chart-5))"
      default:
        return "hsl(var(--chart-6))"
    }
  }

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle>Order Metrics</CardTitle>
        <CardDescription>Overview of your order performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{orderMetrics.total_orders}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(orderMetrics.average_order_value)}</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ChartContainer
            config={Object.fromEntries(
              orderMetrics.order_statuses.map((item) => [
                item.status,
                {
                  label: formatStatus(item.status),
                  color: getStatusColor(item.status),
                },
              ]),
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]} fill="var(--color-placed)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
