"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ResourceData {
  name: string
  type: string
  size: number
  loadTime: number
  url: string
}

interface ResourcePerformanceProps {
  resources: ResourceData[]
  className?: string
}

export function ResourcePerformance({ resources, className }: ResourcePerformanceProps) {
  // Group resources by type
  const resourcesByType = React.useMemo(() => {
    const grouped: Record<string, { count: number; totalSize: number; avgLoadTime: number }> = {}

    resources.forEach((resource) => {
      if (!grouped[resource.type]) {
        grouped[resource.type] = { count: 0, totalSize: 0, avgLoadTime: 0 }
      }

      grouped[resource.type].count++
      grouped[resource.type].totalSize += resource.size
      grouped[resource.type].avgLoadTime += resource.loadTime
    })

    // Calculate averages
    Object.keys(grouped).forEach((type) => {
      grouped[type].avgLoadTime = grouped[type].avgLoadTime / grouped[type].count
    })

    return grouped
  }, [resources])

  // Prepare chart data
  const chartData = React.useMemo(() => {
    return Object.entries(resourcesByType).map(([type, data]) => ({
      type,
      count: data.count,
      totalSize: Math.round(data.totalSize / 1024), // KB
      avgLoadTime: Math.round(data.avgLoadTime),
    }))
  }, [resourcesByType])

  // Sort resources by load time (slowest first)
  const sortedResources = React.useMemo(() => {
    return [...resources].sort((a, b) => b.loadTime - a.loadTime).slice(0, 10)
  }, [resources])

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Resource Performance</CardTitle>
        <CardDescription>Analysis of resource loading times and sizes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <ChartContainer
            config={{
              avgLoadTime: {
                label: "Avg Load Time (ms)",
                color: "hsl(var(--chart-1))",
              },
              totalSize: {
                label: "Total Size (KB)",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" orientation="left" stroke="var(--color-avgLoadTime)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-totalSize)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="avgLoadTime" name="Avg Load Time (ms)" yAxisId="left" fill="var(--color-avgLoadTime)" />
                <Bar dataKey="totalSize" name="Total Size (KB)" yAxisId="right" fill="var(--color-totalSize)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div>
            <h3 className="text-lg font-medium mb-4">Slowest Resources</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Load Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResources.map((resource) => (
                  <TableRow key={resource.url}>
                    <TableCell className="font-medium truncate max-w-[200px]" title={resource.name}>
                      {resource.name}
                    </TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>{formatSize(resource.size)}</TableCell>
                    <TableCell>{resource.loadTime} ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
