import { createServerSupabaseClient } from "./supabase-server"

export type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance"

export interface ServiceHealthCheck {
  name: string
  status: ServiceStatus
  responseTime?: number
  lastChecked: Date
  message?: string
}

export interface SystemStatus {
  overall: ServiceStatus
  services: ServiceHealthCheck[]
  lastUpdated: Date
}

// Check Supabase connection
export async function checkSupabaseStatus(): Promise<ServiceHealthCheck> {
  const startTime = Date.now()
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("health_checks").select("id").limit(1).maybeSingle()

    const responseTime = Date.now() - startTime

    if (error) {
      console.error("Supabase health check error:", error)
      return {
        name: "Database",
        status: "outage",
        responseTime,
        lastChecked: new Date(),
        message: error.message,
      }
    }

    return {
      name: "Database",
      status: "operational",
      responseTime,
      lastChecked: new Date(),
    }
  } catch (error) {
    console.error("Supabase health check exception:", error)
    return {
      name: "Database",
      status: "outage",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Check API endpoints
export async function checkApiStatus(): Promise<ServiceHealthCheck> {
  const startTime = Date.now()
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        name: "API",
        status: "degraded",
        responseTime,
        lastChecked: new Date(),
        message: `Status: ${response.status}`,
      }
    }

    return {
      name: "API",
      status: "operational",
      responseTime,
      lastChecked: new Date(),
    }
  } catch (error) {
    return {
      name: "API",
      status: "outage",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Check authentication service
export async function checkAuthStatus(): Promise<ServiceHealthCheck> {
  const startTime = Date.now()
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        name: "Authentication",
        status: "degraded",
        responseTime,
        lastChecked: new Date(),
        message: error.message,
      }
    }

    return {
      name: "Authentication",
      status: "operational",
      responseTime,
      lastChecked: new Date(),
    }
  } catch (error) {
    return {
      name: "Authentication",
      status: "outage",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Check storage service
export async function checkStorageStatus(): Promise<ServiceHealthCheck> {
  const startTime = Date.now()
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.storage.getBucket("public")

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        name: "Storage",
        status: "degraded",
        responseTime,
        lastChecked: new Date(),
        message: error.message,
      }
    }

    return {
      name: "Storage",
      status: "operational",
      responseTime,
      lastChecked: new Date(),
    }
  } catch (error) {
    return {
      name: "Storage",
      status: "outage",
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Check payment service
export async function checkPaymentStatus(): Promise<ServiceHealthCheck> {
  // This is a mock implementation since we don't have direct access to payment APIs
  return {
    name: "Payment Processing",
    status: "operational",
    responseTime: 150, // Mock response time
    lastChecked: new Date(),
  }
}

// Get overall system status
export async function getSystemStatus(): Promise<SystemStatus> {
  const [dbStatus, apiStatus, authStatus, storageStatus, paymentStatus] = await Promise.all([
    checkSupabaseStatus(),
    checkApiStatus(),
    checkAuthStatus(),
    checkStorageStatus(),
    checkPaymentStatus(),
  ])

  const services = [dbStatus, apiStatus, authStatus, storageStatus, paymentStatus]

  // Determine overall status
  let overall: ServiceStatus = "operational"
  if (services.some((service) => service.status === "outage")) {
    overall = "outage"
  } else if (services.some((service) => service.status === "degraded")) {
    overall = "degraded"
  } else if (services.some((service) => service.status === "maintenance")) {
    overall = "maintenance"
  }

  return {
    overall,
    services,
    lastUpdated: new Date(),
  }
}

// Log status check to database for historical tracking
export async function logStatusCheck(status: SystemStatus): Promise<void> {
  try {
    const supabase = createServerSupabaseClient()

    // Log overall status
    await supabase.from("system_status_logs").insert({
      status: status.overall,
      timestamp: new Date().toISOString(),
    })

    // Log individual service statuses
    for (const service of status.services) {
      await supabase.from("service_status_logs").insert({
        service_name: service.name,
        status: service.status,
        response_time: service.responseTime,
        message: service.message,
        timestamp: service.lastChecked.toISOString(),
      })
    }
  } catch (error) {
    console.error("Failed to log status check:", error)
  }
}
