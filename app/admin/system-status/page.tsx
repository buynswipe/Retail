"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { StatusBadge } from "@/app/components/status-badge"
import { ServiceStatusCard } from "@/app/components/service-status-card"
import { StatusHistoryChart } from "@/app/components/status-history-chart"
import { UptimeDisplay } from "@/app/components/uptime-display"
import type { SystemStatus } from "@/lib/status-service"

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h")

  const fetchStatus = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/status", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch system status: ${response.status}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error("Error fetching system status:", err)
      setError(err instanceof Error ? err.message : "Failed to load system status")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Set up polling every 60 seconds
    const interval = setInterval(fetchStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  // Generate sample uptime data for demo purposes
  const generateUptimeData = () => {
    const services = status?.services || []
    return services.map((service) => {
      // Generate a realistic uptime percentage based on the current status
      let baseUptime = 100
      if (service.status === "degraded") baseUptime = 99.5
      if (service.status === "outage") baseUptime = 98

      // Add some randomness
      const randomVariation = Math.random() * 0.5
      return {
        name: service.name,
        uptime: Math.min(100, baseUptime - randomVariation),
      }
    })
  }

  const uptimeData = generateUptimeData()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Status</h1>
        <Button variant="outline" onClick={fetchStatus} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      ) : isLoading && !status ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <p>Loading system status...</p>
          </CardContent>
        </Card>
      ) : (
        status && (
          <>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">System Status</CardTitle>
                    <CardDescription>Last updated: {new Date(status.lastUpdated).toLocaleString()}</CardDescription>
                  </div>
                  <StatusBadge status={status.overall} size="lg" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {status.services.map((service) => (
                    <ServiceStatusCard key={service.name} service={service} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="24h" value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Performance Metrics</h2>
                <TabsList>
                  <TabsTrigger value="24h">24 Hours</TabsTrigger>
                  <TabsTrigger value="7d">7 Days</TabsTrigger>
                  <TabsTrigger value="30d">30 Days</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="24h" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {uptimeData.map((service) => (
                    <UptimeDisplay
                      key={service.name}
                      serviceName={service.name}
                      uptime={service.uptime}
                      timeRange="24h"
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  {status.services.map((service) => (
                    <StatusHistoryChart key={service.name} serviceName={service.name} timeRange="24h" />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="7d" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {uptimeData.map((service) => (
                    <UptimeDisplay
                      key={service.name}
                      serviceName={service.name}
                      uptime={service.uptime - 0.1} // Slightly lower for longer timeframe
                      timeRange="7d"
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  {status.services.map((service) => (
                    <StatusHistoryChart key={service.name} serviceName={service.name} timeRange="7d" />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="30d" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {uptimeData.map((service) => (
                    <UptimeDisplay
                      key={service.name}
                      serviceName={service.name}
                      uptime={service.uptime - 0.2} // Slightly lower for longer timeframe
                      timeRange="30d"
                    />
                  ))}
                </div>

                <div className="space-y-6">
                  {status.services.map((service) => (
                    <StatusHistoryChart key={service.name} serviceName={service.name} timeRange="30d" />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )
      )}
    </div>
  )
}
