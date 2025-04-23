"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TaxMetrics } from "@/lib/analytics-service"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TaxMetricsCardProps {
  taxMetrics: TaxMetrics
}

export function TaxMetricsCard({ taxMetrics }: TaxMetricsCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Prepare chart data
  const chartData = taxMetrics.tax_by_category.map((item) => ({
    category: item.category,
    amount: item.amount,
  }))

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle>Tax Summary</CardTitle>
        <CardDescription>Overview of collected taxes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Tax Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(taxMetrics.total_tax_collected)}</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ChartContainer
            config={Object.fromEntries(
              taxMetrics.tax_by_category.map((item, index) => [
                item.category,
                {
                  label: item.category,
                  color: `hsl(var(--chart-${index + 1}))`,
                },
              ]),
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" name="Tax Amount" radius={[4, 4, 0, 0]} fill="var(--color-CGST)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
