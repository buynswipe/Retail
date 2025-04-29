import { Suspense } from "react"
import type { Metadata } from "next"
import { getActiveTests } from "@/lib/ab-testing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ABTestResults } from "@/components/analytics/ab-test-results"

export const metadata: Metadata = {
  title: "A/B Testing | RetailBandhu Admin",
  description: "Manage and analyze A/B tests",
}

export default async function ABTestingPage() {
  const activeTests = await getActiveTests()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
        <p className="text-muted-foreground">Manage and analyze your A/B tests to optimize user experience</p>
      </div>

      {activeTests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Tests</CardTitle>
            <CardDescription>Create a new A/B test to start optimizing your application</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Use the createABTest function to set up new tests.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={activeTests[0].id} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeTests.map((test) => (
              <TabsTrigger key={test.id} value={test.id}>
                {test.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeTests.map((test) => (
            <TabsContent key={test.id} value={test.id} className="space-y-4">
              <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
                <ABTestResults testId={test.id} />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
