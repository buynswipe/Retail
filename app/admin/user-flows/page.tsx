import { Suspense } from "react"
import type { Metadata } from "next"
import { getAllUserFlows } from "@/lib/analytics/user-flow-analysis"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { UserFlowChart } from "@/components/analytics/user-flow-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "User Flows | RetailBandhu Admin",
  description: "Analyze user journeys and conversion funnels",
}

export default async function UserFlowsPage({
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

  // Get all defined user flows
  const userFlows = await getAllUserFlows()

  // Default to first flow or "signup-to-purchase" if available
  const defaultFlow =
    userFlows.find((flow) => flow.name === "signup-to-purchase")?.name ||
    (userFlows.length > 0 ? userFlows[0].name : "")

  const selectedFlow = typeof searchParams.flow === "string" ? searchParams.flow : defaultFlow

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Flow Analysis</h1>
          <p className="text-muted-foreground">Analyze how users navigate through critical paths in the application</p>
        </div>

        <DateRangePicker />
      </div>

      {userFlows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No User Flows Defined</CardTitle>
            <CardDescription>Define user flows to start tracking conversion funnels</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Use the defineUserFlow function to create new user flows for analysis.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={selectedFlow} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {userFlows.map((flow) => (
              <TabsTrigger key={flow.name} value={flow.name}>
                {flow.name.replace(/-/g, " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {userFlows.map((flow) => (
            <TabsContent key={flow.name} value={flow.name} className="space-y-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <UserFlowChart flowName={flow.name} startDate={startDate} endDate={endDate} />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
