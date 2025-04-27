"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface StatusLog {
  timestamp: string
  responseTime: number
}

interface StatusHistoryChartProps {
  serviceName: string
  timeRange?: "24h" | "7d" | "30d"
}

export function StatusHistoryChart({ serviceName, timeRange = "24h" }: StatusHistoryChartProps) {
  const [data, setData] = useState<StatusLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/status/history?service=${serviceName}&range=${timeRange}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch status history: ${response.status}`)
        }

        const data = await response.json()
        setData(data)
      } catch (err) {
        console.error("Error fetching status history:", err)
        setError(err instanceof Error ? err.message : "Failed to load status history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [serviceName, timeRange])

  // Generate sample data for demo purposes
  useEffect(() => {
    if (isLoading && !error) {
      const now = new Date()
      const sampleData: StatusLog[] = []

      // Generate data points for the selected time range
      const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30
      const interval = timeRange === "24h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000

      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * interval)
        sampleData.push({
          timestamp: timestamp.toISOString(),
          responseTime: Math.floor(Math.random() * 200) + 50, // Random response time between 50-250ms
        })
      }

      setData(sampleData)
      setIsLoading(false)
    }
  }, [isLoading, error, timeRange])

  const formatData = data.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    responseTime: item.responseTime,
  }))

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{serviceName} Response Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              responseTime: {
                label: "Response Time (ms)",
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatData}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    return timeRange === "24h" ? value.split(":").slice(0, 2).join(":") : value
                  }}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="var(--color-responseTime)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
