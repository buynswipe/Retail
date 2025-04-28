import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface ChartCardProps {
  title: string
  description?: string
  data: any[]
  type: "line" | "bar"
  dataKeys: string[]
  colors?: string[]
  xAxisKey?: string
  className?: string
}

export function ChartCard({
  title,
  description,
  data,
  type,
  dataKeys,
  colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"],
  xAxisKey = "name",
  className,
}: ChartCardProps) {
  // Create config object for ChartContainer
  const config: Record<string, { label: string; color: string }> = {}
  dataKeys.forEach((key, index) => {
    config[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      color: colors[index % colors.length],
    }
  })

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {dataKeys.map((key, index) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} activeDot={{ r: 8 }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {dataKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} fill={`var(--color-${key})`} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
