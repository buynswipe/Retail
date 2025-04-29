"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PagePerformanceProps {
  data: {
    page: string
    url: string
    metrics: {
      date: string
      lcp: number
      fid: number
      cls: number
      ttfb: number
    }[]
  }[]
  selectedMetric?: "lcp" | "fid" | "cls" | "ttfb"
  className?: string
}

export function PagePerformance({ data, selectedMetric = "lcp", className }: PagePerformanceProps) {
  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Get unique dates across all pages
    const allDates = new Set<string>()
    data.forEach((page) => {
      page.metrics.forEach((metric) => {
        allDates.add(metric.date)
      })
    })

    // Sort dates
    const sortedDates = Array.from(allDates).sort()

    // Create data points for each date
    return sortedDates.map((date) => {
      const dataPoint: Record<string, any> = { date }

      // Add metric value for each page
      data.forEach((page) => {
        const metric = page.metrics.find((m) => m.date === date)
        if (metric) {
          dataPoint[page.page] = metric[selectedMetric]
        }
      })

      return dataPoint
    })
  }, [data, selectedMetric])

  const metricLabels = {
    lcp: "Largest Contentful Paint (ms)",
    fid: "First Input Delay (ms)",
    cls: "Cumulative Layout Shift",
    ttfb: "Time to First Byte (ms)",
  }

  const metricColors = {
    lcp: "hsl(var(--chart-1))",
    fid: "hsl(var(--chart-2))",
    cls: "hsl(var(--chart-3))",
    ttfb: "hsl(var(--chart-4))",
  }

  // Create config for chart
  const config = React.useMemo(() => {
    const result: Record<string, { label: string; color: string }> = {}

    data.forEach((page, index) => {
      result[page.page] = {
        label: page.page,
        color: `hsl(var(--chart-${(index % 12) + 1}))`,
      }
    })

    return result
  }, [data])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Page Performance</CardTitle>
        <CardDescription>{metricLabels[selectedMetric]}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {data.map((page) => (
                <Line
                  key={page.page}
                  type="monotone"
                  dataKey={page.page}
                  stroke={`var(--color-${page.page.replace(/\s+/g, "-").toLowerCase()})`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
