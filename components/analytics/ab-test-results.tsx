"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ABTestResultsProps {
  testId: string
}

interface TestData {
  test: {
    id: string
    name: string
    description: string
    variants: string[]
    start_date: string
    end_date: string | null
  }
  results: {
    variant: string
    exposures: number
    conversions: number
    conversion_rate: number
  }[]
}

export function ABTestResults({ testId }: ABTestResultsProps) {
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTestResults() {
      setLoading(true)
      setError(null)

      try {
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from("ab_tests")
          .select("*")
          .eq("id", testId)
          .single()

        if (testError) throw testError

        // Fetch exposures by variant
        const { data: exposuresData, error: exposuresError } = await supabase
          .from("ab_test_exposures")
          .select("variant, count")
          .eq("test_id", testId)
          .group("variant")

        if (exposuresError) throw exposuresError

        // Fetch conversions by variant
        const { data: conversionsData, error: conversionsError } = await supabase
          .from("ab_test_conversions")
          .select("variant, count")
          .eq("test_id", testId)
          .group("variant")

        if (conversionsError) throw conversionsError

        // Process results
        const exposuresByVariant = exposuresData.reduce(
          (acc, item) => {
            acc[item.variant] = item.count
            return acc
          },
          {} as Record<string, number>,
        )

        const conversionsByVariant = conversionsData.reduce(
          (acc, item) => {
            acc[item.variant] = item.count
            return acc
          },
          {} as Record<string, number>,
        )

        const results = testData.variants.map((variant) => {
          const exposures = exposuresByVariant[variant] || 0
          const conversions = conversionsByVariant[variant] || 0
          const conversion_rate = exposures > 0 ? conversions / exposures : 0

          return {
            variant,
            exposures,
            conversions,
            conversion_rate,
          }
        })

        setTestData({
          test: testData,
          results,
        })
      } catch (err) {
        console.error("Error fetching test results:", err)
        setError("Failed to load test results")
      } finally {
        setLoading(false)
      }
    }

    fetchTestResults()
  }, [testId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !testData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Failed to load test data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "No data available for this test"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { test, results } = testData

  // Format data for chart
  const chartData = results.map((result) => ({
    variant: result.variant,
    exposures: result.exposures,
    conversions: result.conversions,
    conversion_rate: Number.parseFloat((result.conversion_rate * 100).toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{test.name}</CardTitle>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium">Start Date</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-2xl font-bold">{new Date(test.start_date).toLocaleDateString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium">End Date</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-2xl font-bold">
                  {test.end_date ? new Date(test.end_date).toLocaleDateString() : "Ongoing"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium">Total Exposures</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-2xl font-bold">
                  {results.reduce((sum, r) => sum + r.exposures, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates by Variant</CardTitle>
          <CardDescription>Comparing performance across test variants</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              conversion_rate: {
                label: "Conversion Rate (%)",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="conversion_rate" fill="var(--color-conversion_rate)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((result, index) => (
          <Card key={result.variant}>
            <CardHeader>
              <CardTitle>Variant {result.variant}</CardTitle>
              <CardDescription>Performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Exposures</dt>
                  <dd className="text-2xl font-bold">{result.exposures.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Conversions</dt>
                  <dd className="text-2xl font-bold">{result.conversions.toLocaleString()}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Conversion Rate</dt>
                  <dd className="text-2xl font-bold">{(result.conversion_rate * 100).toFixed(2)}%</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
