import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface PerformanceMetric {
  id: string
  endpoint: string
  response_time: number
  status_code: number
  user_id: string | null
  created_at: string
}

export interface EndpointPerformance {
  endpoint: string
  avg_response_time: number
  min_response_time: number
  max_response_time: number
  p95_response_time: number
  request_count: number
  error_rate: number
}

export async function recordPerformanceMetric(
  endpoint: string,
  responseTime: number,
  statusCode: number,
  userId?: string,
) {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("performance_metrics").insert([
      {
        endpoint,
        response_time: responseTime,
        status_code: statusCode,
        user_id: userId || null,
      },
    ])

    if (error) {
      logger.error("Error recording performance metric", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    logger.error("Error recording performance metric", error)
    return { success: false, error }
  }
}

export async function getPerformanceMetrics(startDate?: string, endDate?: string, limit = 100) {
  try {
    const supabase = createClient()

    let query = supabase.from("performance_metrics").select("*").order("created_at", { ascending: false }).limit(limit)

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      logger.error("Error fetching performance metrics", error)
      throw error
    }

    return data as PerformanceMetric[]
  } catch (error) {
    logger.error("Error getting performance metrics", error)
    return []
  }
}

export async function getEndpointPerformance(): Promise<EndpointPerformance[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc("get_endpoint_performance")

    if (error) {
      logger.error("Error fetching endpoint performance", error)
      throw error
    }

    return data as EndpointPerformance[]
  } catch (error) {
    logger.error("Error getting endpoint performance", error)
    return []
  }
}

export async function getPerformanceSummary() {
  try {
    const endpoints = await getEndpointPerformance()

    const totalRequests = endpoints.reduce((sum, ep) => sum + ep.request_count, 0)
    const avgResponseTime =
      endpoints.reduce((sum, ep) => sum + ep.avg_response_time * ep.request_count, 0) / totalRequests
    const errorCount = endpoints.reduce((sum, ep) => sum + (ep.error_rate * ep.request_count) / 100, 0)

    return {
      totalRequests,
      avgResponseTime,
      errorRate: (errorCount / totalRequests) * 100,
      slowestEndpoint: endpoints.sort((a, b) => b.avg_response_time - a.avg_response_time)[0]?.endpoint || "N/A",
      mostErrorProne: endpoints.sort((a, b) => b.error_rate - a.error_rate)[0]?.endpoint || "N/A",
    }
  } catch (error) {
    logger.error("Error getting performance summary", error)
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      slowestEndpoint: "N/A",
      mostErrorProne: "N/A",
    }
  }
}
