"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PerformanceOverviewProps {
  data: {
    date: string
    avg_lcp: number
    avg_fid: number
    avg_cls: number
    avg_ttfb: number
  }[]
}

export function PerformanceOverview({ data }: PerformanceOverviewProps) {
  // Format data for charts
  const lcpData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    value: Number.parseFloat(item.avg_lcp.toFixed(2)),
  }))

  const fidData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    value: Number.parseFloat(item.avg_fid.toFixed(2)),
  }))

  const clsData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    value: Number.parseFloat(item.avg_cls.toFixed(3)),
  }))

  const ttfbData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    value: Number.parseFloat(item.avg_ttfb.toFixed(2)),
  }))

  // Calculate current values (latest day)
  const currentLCP = data.length > 0 ? data[data.length - 1].avg_lcp : 0
  const currentFID = data.length > 0 ? data[data.length - 1].avg_fid : 0
  const currentCLS = data.length > 0 ? data[data.length - 1].avg_cls : 0
  const currentTTFB = data.length > 0 ? data[data.length - 1].avg_ttfb : 0

  // Determine status based on Core Web Vitals thresholds
  const lcpStatus = currentLCP <= 2500 ? "good" : currentLCP <= 4000 ? "needs-improvement" : "poor"
  const fidStatus = currentFID <= 100 ? "good" : currentFID <= 300 ? "needs-improvement" : "poor"
  const clsStatus = currentCLS <= 0.1 ? "good" : currentCLS <= 0.25 ? "needs-improvement" : "poor"
  const ttfbStatus = currentTTFB <= 800 ? "good" : currentTTFB <= 1800 ? "needs-improvement" : "poor"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "needs-improvement":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "good":
        return "Good"
      case "needs-improvement":
        return "Needs Improvement"
      case "poor":
        return "Poor"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Overview</h2>
      <p className="text-muted-foreground">Core Web Vitals and performance metrics over time</p>

      <Tabs defaultValue="lcp" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="lcp">LCP</TabsTrigger>
          <TabsTrigger value="fid">FID</TabsTrigger>
          <TabsTrigger value="cls">CLS</TabsTrigger>
          <TabsTrigger value="ttfb">TTFB</TabsTrigger>
        </TabsList>

        <TabsContent value="lcp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Largest Contentful Paint</CardTitle>
                <CardDescription>Time until largest content element is rendered</CardDescription>
              </div>
              <Badge className={getStatusColor(lcpStatus)}>
                {currentLCP.toFixed(2)} ms - {getStatusText(lcpStatus)}
              </Badge>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lcpData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" name="LCP (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Good:</strong> &le; 2500ms | <strong>Needs Improvement:</strong> &le; 4000ms |{" "}
                  <strong>Poor:</strong> &gt; 4000ms
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fid">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              ems-center justify-between pb-2">
              <div>
                <CardTitle>First Input Delay</CardTitle>
                <CardDescription>Time from first user interaction to response</CardDescription>
              </div>
              <Badge className={getStatusColor(fidStatus)}>
                {currentFID.toFixed(2)} ms - {getStatusText(fidStatus)}
              </Badge>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fidData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" name="FID (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Good:</strong> ≤ 100ms | <strong>Needs Improvement:</strong> ≤ 300ms | <strong>Poor:</strong>{" "}
                  > 300ms
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cls">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Cumulative Layout Shift</CardTitle>
                <CardDescription>Measure of visual stability</CardDescription>
              </div>
              <Badge className={getStatusColor(clsStatus)}>
                {currentCLS.toFixed(3)} - {getStatusText(clsStatus)}
              </Badge>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ffc658" name="CLS" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Good:</strong> ≤ 0.1 | <strong>Needs Improvement:</strong> ≤ 0.25 | <strong>Poor:</strong> >
                  0.25
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ttfb">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Time to First Byte</CardTitle>
                <CardDescription>Server response time</CardDescription>
              </div>
              <Badge className={getStatusColor(ttfbStatus)}>
                {currentTTFB.toFixed(2)} ms - {getStatusText(ttfbStatus)}
              </Badge>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ttfbData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ff7300" name="TTFB (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Good:</strong> ≤ 800ms | <strong>Needs Improvement:</strong> ≤ 1800ms | <strong>Poor:</strong>{" "}
                  > 1800ms
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
