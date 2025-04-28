"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { format, parseISO } from "date-fns"

interface ForecastChartProps {
  title: string
  description?: string
  data: { date: string; value: number; isForecast: boolean }[]
  valueLabel: string
  className?: string
}

export function ForecastChart({ title, description, data, valueLabel, className }: ForecastChartProps) {
  // Find the index where forecast starts
  const forecastStartIndex = data.findIndex((item) => item.isForecast)

  // Format the data for display
  const formattedData = data.map((item) => ({
    date: format(parseISO(item.date), "MMM dd"),
    [valueLabel]: item.value,
    isForecast: item.isForecast,
  }))

  // Create config object for ChartContainer
  const config: Record<string, { label: string; color: string }> = {
    [valueLabel]: {
      label: valueLabel.charAt(0).toUpperCase() + valueLabel.slice(1).replace(/([A-Z])/g, " $1"),
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name, props) => {
                  const isForecast = props.payload.isForecast
                  return [value, `${name}${isForecast ? " (Forecast)" : ""}`]
                }}
              />
              <Legend />

              {/* Add a reference line where forecast starts */}
              {forecastStartIndex > 0 && (
                <ReferenceLine
                  x={formattedData[forecastStartIndex]?.date}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{ value: "Forecast Start", position: "top", fill: "#666" }}
                />
              )}

              {/* Historical data line */}
              <Line
                type="monotone"
                dataKey={valueLabel}
                stroke={`var(--color-${valueLabel})`}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />

              {/* Forecast data line (dashed) */}
              <Line
                type="monotone"
                dataKey={valueLabel}
                stroke={`var(--color-${valueLabel})`}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                data={formattedData.filter((item) => item.isForecast)}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
