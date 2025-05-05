import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"

// Define payment analytics event types
export type PaymentEventType =
  | "payment_initiated"
  | "payment_completed"
  | "payment_failed"
  | "payment_abandoned"
  | "payment_retried"
  | "payment_refunded"

// Define payment analytics event interface
export interface PaymentEvent {
  event_type: PaymentEventType
  user_id: string
  order_id: string
  payment_id?: string
  payment_method: string
  amount: number
  gateway: string
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Track a payment-related event
 * @param event Payment event to track
 * @returns Promise with success status
 */
export async function trackPaymentEvent(event: Omit<PaymentEvent, "timestamp">): Promise<boolean> {
  try {
    // Add timestamp if not provided
    const eventWithTimestamp: PaymentEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    // Insert event into payment_events table
    const { error } = await supabase.from("payment_events").insert(eventWithTimestamp)

    if (error) {
      console.error("Error tracking payment event:", error)
      return false
    }

    return true
  } catch (error) {
    return errorHandler(error, "Error tracking payment event", false)
  }
}

/**
 * Get payment conversion rate for a specific time period
 * @param timeframe Time period to analyze (day, week, month, year)
 * @returns Promise with conversion rate data
 */
export async function getPaymentConversionRate(timeframe: "day" | "week" | "month" | "year" = "month"): Promise<{
  initiated: number
  completed: number
  failed: number
  abandoned: number
  conversionRate: number
  error?: any
}> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "day":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get payment events for the time period
    const { data, error } = await supabase
      .from("payment_events")
      .select("event_type")
      .gte("timestamp", startDateStr)
      .order("timestamp", { ascending: false })

    if (error) {
      throw error
    }

    // Count events by type
    const initiated = data.filter((event) => event.event_type === "payment_initiated").length
    const completed = data.filter((event) => event.event_type === "payment_completed").length
    const failed = data.filter((event) => event.event_type === "payment_failed").length
    const abandoned = data.filter((event) => event.event_type === "payment_abandoned").length

    // Calculate conversion rate
    const conversionRate = initiated > 0 ? (completed / initiated) * 100 : 0

    return {
      initiated,
      completed,
      failed,
      abandoned,
      conversionRate,
    }
  } catch (error) {
    console.error("Error getting payment conversion rate:", error)
    return {
      initiated: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
      conversionRate: 0,
      error,
    }
  }
}

/**
 * Get payment method distribution for a specific time period
 * @param timeframe Time period to analyze (day, week, month, year)
 * @returns Promise with payment method distribution data
 */
export async function getPaymentMethodDistribution(timeframe: "day" | "week" | "month" | "year" = "month"): Promise<{
  distribution: Record<string, { count: number; amount: number; percentage: number }>
  error?: any
}> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "day":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get completed payment events for the time period
    const { data, error } = await supabase
      .from("payment_events")
      .select("payment_method, amount")
      .eq("event_type", "payment_completed")
      .gte("timestamp", startDateStr)
      .order("timestamp", { ascending: false })

    if (error) {
      throw error
    }

    // Group by payment method
    const methodCounts: Record<string, { count: number; amount: number }> = {}
    let totalCount = 0
    let totalAmount = 0

    data.forEach((event) => {
      const method = event.payment_method
      if (!methodCounts[method]) {
        methodCounts[method] = { count: 0, amount: 0 }
      }
      methodCounts[method].count += 1
      methodCounts[method].amount += event.amount || 0
      totalCount += 1
      totalAmount += event.amount || 0
    })

    // Calculate percentages
    const distribution: Record<string, { count: number; amount: number; percentage: number }> = {}
    Object.entries(methodCounts).forEach(([method, { count, amount }]) => {
      distribution[method] = {
        count,
        amount,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
      }
    })

    return { distribution }
  } catch (error) {
    console.error("Error getting payment method distribution:", error)
    return { distribution: {}, error }
  }
}

/**
 * Get payment failure reasons for a specific time period
 * @param timeframe Time period to analyze (day, week, month, year)
 * @returns Promise with payment failure reasons data
 */
export async function getPaymentFailureReasons(timeframe: "day" | "week" | "month" | "year" = "month"): Promise<{
  reasons: Record<string, { count: number; percentage: number }>
  error?: any
}> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "day":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get failed payment events for the time period
    const { data, error } = await supabase
      .from("payment_events")
      .select("metadata")
      .eq("event_type", "payment_failed")
      .gte("timestamp", startDateStr)
      .order("timestamp", { ascending: false })

    if (error) {
      throw error
    }

    // Group by failure reason
    const reasonCounts: Record<string, number> = {}
    let totalCount = 0

    data.forEach((event) => {
      const reason = event.metadata?.reason || "Unknown"
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      totalCount += 1
    })

    // Calculate percentages
    const reasons: Record<string, { count: number; percentage: number }> = {}
    Object.entries(reasonCounts).forEach(([reason, count]) => {
      reasons[reason] = {
        count,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
      }
    })

    return { reasons }
  } catch (error) {
    console.error("Error getting payment failure reasons:", error)
    return { reasons: {}, error }
  }
}

/**
 * Get payment retry success rate
 * @param timeframe Time period to analyze (day, week, month, year)
 * @returns Promise with payment retry success rate data
 */
export async function getPaymentRetrySuccessRate(timeframe: "day" | "week" | "month" | "year" = "month"): Promise<{
  retries: number
  successful: number
  successRate: number
  error?: any
}> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "day":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get payment retry events for the time period
    const { data: retryEvents, error: retryError } = await supabase
      .from("payment_events")
      .select("order_id, payment_id")
      .eq("event_type", "payment_retried")
      .gte("timestamp", startDateStr)

    if (retryError) {
      throw retryError
    }

    // Get successful payments after retries
    const orderIds = retryEvents.map((event) => event.order_id)
    const { data: successEvents, error: successError } = await supabase
      .from("payment_events")
      .select("order_id")
      .eq("event_type", "payment_completed")
      .in("order_id", orderIds)
      .gte("timestamp", startDateStr)

    if (successError) {
      throw successError
    }

    // Calculate success rate
    const retries = retryEvents.length
    const successful = successEvents.length
    const successRate = retries > 0 ? (successful / retries) * 100 : 0

    return {
      retries,
      successful,
      successRate,
    }
  } catch (error) {
    console.error("Error getting payment retry success rate:", error)
    return {
      retries: 0,
      successful: 0,
      successRate: 0,
      error,
    }
  }
}

/**
 * Get payment gateway performance metrics
 * @param timeframe Time period to analyze (day, week, month, year)
 * @returns Promise with payment gateway performance data
 */
export async function getPaymentGatewayPerformance(timeframe: "day" | "week" | "month" | "year" = "month"): Promise<{
  gateways: Record<
    string,
    {
      initiated: number
      completed: number
      failed: number
      conversionRate: number
      averageTime: number
    }
  >
  error?: any
}> {
  try {
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case "day":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "month":
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const startDateStr = startDate.toISOString()

    // Get payment events for the time period
    const { data, error } = await supabase
      .from("payment_events")
      .select("event_type, gateway, timestamp, payment_id")
      .gte("timestamp", startDateStr)
      .order("timestamp", { ascending: true })

    if (error) {
      throw error
    }

    // Group by gateway
    const gatewayStats: Record<
      string,
      {
        initiated: number
        completed: number
        failed: number
        initiationTimes: Record<string, string>
        completionTimes: Record<string, string>
      }
    > = {}

    data.forEach((event) => {
      const gateway = event.gateway
      if (!gatewayStats[gateway]) {
        gatewayStats[gateway] = {
          initiated: 0,
          completed: 0,
          failed: 0,
          initiationTimes: {},
          completionTimes: {},
        }
      }

      if (event.event_type === "payment_initiated") {
        gatewayStats[gateway].initiated += 1
        if (event.payment_id) {
          gatewayStats[gateway].initiationTimes[event.payment_id] = event.timestamp
        }
      } else if (event.event_type === "payment_completed") {
        gatewayStats[gateway].completed += 1
        if (event.payment_id) {
          gatewayStats[gateway].completionTimes[event.payment_id] = event.timestamp
        }
      } else if (event.event_type === "payment_failed") {
        gatewayStats[gateway].failed += 1
      }
    })

    // Calculate metrics
    const gateways: Record<
      string,
      {
        initiated: number
        completed: number
        failed: number
        conversionRate: number
        averageTime: number
      }
    > = {}

    Object.entries(gatewayStats).forEach(([gateway, stats]) => {
      const conversionRate = stats.initiated > 0 ? (stats.completed / stats.initiated) * 100 : 0

      // Calculate average time to complete payment
      let totalTime = 0
      let timeCount = 0

      Object.entries(stats.completionTimes).forEach(([paymentId, completionTime]) => {
        const initiationTime = stats.initiationTimes[paymentId]
        if (initiationTime) {
          const start = new Date(initiationTime).getTime()
          const end = new Date(completionTime).getTime()
          const timeDiff = end - start
          if (timeDiff > 0) {
            totalTime += timeDiff
            timeCount += 1
          }
        }
      })

      const averageTime = timeCount > 0 ? totalTime / timeCount : 0

      gateways[gateway] = {
        initiated: stats.initiated,
        completed: stats.completed,
        failed: stats.failed,
        conversionRate,
        averageTime,
      }
    })

    return { gateways }
  } catch (error) {
    console.error("Error getting payment gateway performance:", error)
    return { gateways: {}, error }
  }
}
