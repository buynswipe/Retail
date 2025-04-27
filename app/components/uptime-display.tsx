"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface UptimeDisplayProps {
  serviceName: string
  uptime: number // percentage
  timeRange?: "24h" | "7d" | "30d"
}

export function UptimeDisplay({ serviceName, uptime, timeRange = "24h" }: UptimeDisplayProps) {
  const formattedUptime = uptime.toFixed(2)

  // Determine color based on uptime percentage
  const getColorClass = () => {
    if (uptime >= 99.9) return "text-green-500"
    if (uptime >= 99) return "text-yellow-500"
    return "text-red-500"
  }

  // Determine progress color
  const getProgressColor = () => {
    if (uptime >= 99.9) return "bg-green-500"
    if (uptime >= 99) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{serviceName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Uptime ({timeRange})</span>
            <span className={`text-lg font-bold ${getColorClass()}`}>{formattedUptime}%</span>
          </div>
          <Progress value={uptime} className="h-2" indicatorClassName={getProgressColor()} />
        </div>
      </CardContent>
    </Card>
  )
}
