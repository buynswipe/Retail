"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample performance data
const responseTimeData = [
  { timestamp: "00:00", avg: 120, p95: 180, p99: 220 },
  { timestamp: "01:00", avg: 115, p95: 175, p99: 210 },
  { timestamp: "02:00", avg: 100, p95: 160, p99: 200 },
  { timestamp: "03:00", avg: 90, p95: 150, p99: 190 },
  { timestamp: "04:00", avg: 95, p95: 155, p99: 195 },
  { timestamp: "05:00", avg: 110, p95: 170, p99: 205 },
  { timestamp: "06:00", avg: 130, p95: 190, p99: 230 },
  { timestamp: "07:00", avg: 150, p95: 210, p99: 250 },
  { timestamp: "08:00", avg: 180, p95: 240, p99: 280 },
  { timestamp: "09:00", avg: 200, p95: 260, p99: 300 },
  { timestamp: "10:00", avg: 190, p95: 250, p99: 290 },
  { timestamp: "11:00", avg: 170, p95: 230, p99: 270 },
]

const cpuUsageData = [
  { timestamp: "00:00", usage: 25 },
  { timestamp: "01:00", usage: 22 },
  { timestamp: "02:00", usage: 20 },
  { timestamp: "03:00", usage: 18 },
  { timestamp: "04:00", usage: 19 },
  { timestamp: "05:00", usage: 23 },
  { timestamp: "06:00", usage: 28 },
  { timestamp: "07:00", usage: 35 },
  { timestamp: "08:00", usage: 45 },
  { timestamp: "09:00", usage: 55 },
  { timestamp: "10:00", usage: 48 },
  { timestamp: "11:00", usage: 40 },
]

const memoryUsageData = [
  { timestamp: "00:00", used: 1.2, total: 4 },
  { timestamp: "01:00", used: 1.1, total: 4 },
  { timestamp: "02:00", used: 1.0, total: 4 },
  { timestamp: "03:00", used: 0.9, total: 4 },
  { timestamp: "04:00", used: 1.0, total: 4 },
  { timestamp: "05:00", used: 1.1, total: 4 },
  { timestamp: "06:00", used: 1.3, total: 4 },
  { timestamp: "07:00", used: 1.5, total: 4 },
  { timestamp: "08:00", used: 1.8, total: 4 },
  { timestamp: "09:00", used: 2.0, total: 4 },
  { timestamp: "10:00", used: 1.9, total: 4 },
  { timestamp: "11:00", used: 1.7, total: 4 },
]

const endpointPerformanceData = [
  { endpoint: "/api/products", avg: 120, p95: 180, p99: 220, count: 1250 },
  { endpoint: "/api/orders", avg: 150, p95: 210, p99: 250, count: 980 },
  { endpoint: "/api/users", avg: 90, p95: 150, p99: 190, count: 750 },
  { endpoint: "/api/payments", avg: 180, p95: 240, p99: 280, count: 620 },
  { endpoint: "/api/deliveries", avg: 130, p95: 190, p99: 230, count: 540 },
  { endpoint: "/api/notifications", avg: 70, p95: 130, p99: 170, count: 1800 },
  { endpoint: "/api/tax", avg: 160, p95: 220, p99: 260, count: 320 },
  { endpoint: "/api/status", avg: 50, p95: 110, p99: 150, count: 2100 },
]

export default function PerformanceMonitoringPage() {
  const [timeRange, setTimeRange] = useState("12h")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="12h">Last 12 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142ms</div>
                <p className="text-xs text-muted-foreground">+5% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,240</div>
                <p className="text-xs text-muted-foreground">+12% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.05%</div>
                <p className="text-xs text-muted-foreground">-2% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32%</div>
                <p className="text-xs text-muted-foreground">+8% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>Average, P95, and P99 response times</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  avg: {
                    label: "Average",
                    color: "hsl(var(--chart-1))",
                  },
                  p95: {
                    label: "P95",
                    color: "hsl(var(--chart-2))",
                  },
                  p99: {
                    label: "P99",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="var(--color-avg)" strokeWidth={2} />
                    <Line type="monotone" dataKey="p95" stroke="var(--color-p95)" strokeWidth={2} />
                    <Line type="monotone" dataKey="p99" stroke="var(--color-p99)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
              <CardDescription>Response times by endpoint (milliseconds)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Endpoint</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Avg (ms)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">P95 (ms)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">P99 (ms)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpointPerformanceData.map((endpoint) => (
                      <tr key={endpoint.endpoint}>
                        <td className="px-4 py-3 text-sm">{endpoint.endpoint}</td>
                        <td className="px-4 py-3 text-sm">{endpoint.avg}</td>
                        <td className="px-4 py-3 text-sm">{endpoint.p95}</td>
                        <td className="px-4 py-3 text-sm">{endpoint.p99}</td>
                        <td className="px-4 py-3 text-sm">{endpoint.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoint Request Distribution</CardTitle>
              <CardDescription>Number of requests per endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Request Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={endpointPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
                <CardDescription>Percentage of CPU utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    usage: {
                      label: "CPU Usage",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="usage"
                        stroke="var(--color-usage)"
                        fill="var(--color-usage)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Memory utilization in GB</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    used: {
                      label: "Used Memory",
                      color: "hsl(var(--chart-1))",
                    },
                    total: {
                      label: "Total Memory",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memoryUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        fill="var(--color-total)"
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        dataKey="used"
                        stroke="var(--color-used)"
                        fill="var(--color-used)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
              <CardDescription>Errors by type and endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Error Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Endpoint</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Count</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Last Occurred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 text-sm">Database Connection</td>
                      <td className="px-4 py-3 text-sm">/api/products</td>
                      <td className="px-4 py-3 text-sm">12</td>
                      <td className="px-4 py-3 text-sm">2023-04-27 10:15:22</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Authentication Failed</td>
                      <td className="px-4 py-3 text-sm">/api/users</td>
                      <td className="px-4 py-3 text-sm">8</td>
                      <td className="px-4 py-3 text-sm">2023-04-27 09:45:11</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Rate Limit Exceeded</td>
                      <td className="px-4 py-3 text-sm">/api/orders</td>
                      <td className="px-4 py-3 text-sm">5</td>
                      <td className="px-4 py-3 text-sm">2023-04-27 08:30:45</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Invalid Input</td>
                      <td className="px-4 py-3 text-sm">/api/payments</td>
                      <td className="px-4 py-3 text-sm">15</td>
                      <td className="px-4 py-3 text-sm">2023-04-27 11:05:33</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Permission Denied</td>
                      <td className="px-4 py-3 text-sm">/api/admin/users</td>
                      <td className="px-4 py-3 text-sm">3</td>
                      <td className="px-4 py-3 text-sm">2023-04-27 07:22:18</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Rate Over Time</CardTitle>
              <CardDescription>Percentage of requests resulting in errors</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  errorRate: {
                    label: "Error Rate",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { timestamp: "00:00", errorRate: 0.08 },
                      { timestamp: "01:00", errorRate: 0.07 },
                      { timestamp: "02:00", errorRate: 0.05 },
                      { timestamp: "03:00", errorRate: 0.04 },
                      { timestamp: "04:00", errorRate: 0.06 },
                      { timestamp: "05:00", errorRate: 0.09 },
                      { timestamp: "06:00", errorRate: 0.12 },
                      { timestamp: "07:00", errorRate: 0.1 },
                      { timestamp: "08:00", errorRate: 0.07 },
                      { timestamp: "09:00", errorRate: 0.05 },
                      { timestamp: "10:00", errorRate: 0.04 },
                      { timestamp: "11:00", errorRate: 0.03 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(2)}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="errorRate" stroke="var(--color-errorRate)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
