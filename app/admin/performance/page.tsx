import { Suspense } from "react"
import type { Metadata } from "next"
import { supabase } from "@/lib/supabase-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { PerformanceOverview } from "@/components/analytics/performance-overview"
import { PagePerformance } from "@/components/analytics/page-performance"
import { ResourcePerformance } from "@/components/analytics/resource-performance"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Performance Monitoring | RetailBandhu Admin",
  description: "Monitor and analyze application performance metrics",
}

// Revalidate every hour
export const revalidate = 3600

async function getPerformanceData(startDate: string, endDate: string) {
  // Get core web vitals averages
  const { data: coreWebVitals, error: vitalsError } = await supabase.rpc("get_core_web_vitals_summary", {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (vitalsError) {
    console.error("Error fetching core web vitals:", vitalsError)
  }

  // Get page performance data
  const { data: pagePerformance, error: pageError } = await supabase.rpc("get_page_performance_summary", {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (pageError) {
    console.error("Error fetching page performance:", pageError)
  }

  // Get resource performance data
  const { data: resourcePerformance, error: resourceError } = await supabase.rpc("get_resource_performance_summary", {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (resourceError) {
    console.error("Error fetching resource performance:", resourceError)
  }

  return {
    coreWebVitals: coreWebVitals || [],
    pagePerformance: pagePerformance || [],
    resourcePerformance: resourcePerformance || [],
  }
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Get date range from query params or use defaults
  const startDate =
    typeof searchParams.start === "string"
      ? searchParams.start
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const endDate = typeof searchParams.end === "string" ? searchParams.end : new Date().toISOString().split("T")[0]

  const performanceData = await getPerformanceData(startDate, endDate)

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-muted-foreground">Monitor and analyze application performance metrics</p>
        </div>

        <DateRangePicker />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <PerformanceOverview data={performanceData.coreWebVitals} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <PagePerformance data={performanceData.pagePerformance} />
          </Suspense>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <ResourcePerformance data={performanceData.resourcePerformance} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
