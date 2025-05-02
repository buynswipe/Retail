"use client"

import { useState, useEffect } from "react"
import { analyticsService } from "@/lib/analytics-service"

export type DateRange = "week" | "month" | "quarter" | "year" | "custom"
export type AnalyticsType = "retailer" | "wholesaler"

interface AnalyticsDataParams {
  type: AnalyticsType
  dateRange: DateRange
  startDate?: string
  endDate?: string
  userId?: string
}

export function useAnalyticsData({ type, dateRange, startDate, endDate, userId }: AnalyticsDataParams) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to refresh data
  const refreshData = () => setRefreshTrigger((prev) => prev + 1)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const signal = controller.signal

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        let analyticsData
        if (type === "retailer") {
          analyticsData = await analyticsService.getRetailerAnalytics({
            dateRange,
            startDate,
            endDate,
            userId,
            signal,
          })
        } else {
          analyticsData = await analyticsService.getWholesalerAnalytics({
            dateRange,
            startDate,
            endDate,
            userId,
            signal,
          })
        }

        if (isMounted) {
          setData(analyticsData)
        }
      } catch (err) {
        if (isMounted && err.name !== "AbortError") {
          console.error(`Error fetching ${type} analytics:`, err)
          setError(err instanceof Error ? err : new Error("Failed to fetch analytics data"))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [type, dateRange, startDate, endDate, userId, refreshTrigger])

  return {
    data,
    loading,
    error,
    refreshData,
  }
}
