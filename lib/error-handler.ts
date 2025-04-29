// Error types
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  SERVER = "server",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

// Error interface
export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
}

// Create a standardized error
export function createError(type: ErrorType, message: string, code?: string, details?: any): AppError {
  return {
    type,
    message,
    code,
    details,
  }
}

// Handle Supabase errors
export function handleSupabaseError(error: any): AppError {
  console.error("Supabase error:", error)

  if (!error) {
    return createError(ErrorType.UNKNOWN, "An unknown error occurred")
  }

  // Authentication errors
  if (error.code === "PGRST301" || error.code === "PGRST302") {
    return createError(ErrorType.AUTHENTICATION, "Authentication failed", error.code)
  }

  // Authorization errors
  if (error.code === "PGRST401" || error.code === "PGRST403") {
    return createError(ErrorType.AUTHORIZATION, "You don't have permission to perform this action", error.code)
  }

  // Not found errors
  if (error.code === "PGRST404" || error.code === "PGRST116") {
    return createError(ErrorType.NOT_FOUND, "The requested resource was not found", error.code)
  }

  // Validation errors
  if (error.code === "PGRST400" || error.code?.startsWith("23")) {
    return createError(ErrorType.VALIDATION, "Invalid data provided", error.code, error.details)
  }

  // Server errors
  if (error.code?.startsWith("5")) {
    return createError(ErrorType.SERVER, "A server error occurred", error.code)
  }

  // Network errors
  if (error.message?.includes("network") || error.message?.includes("fetch")) {
    return createError(ErrorType.NETWORK, "A network error occurred. Please check your connection", "NETWORK_ERROR")
  }

  // Default unknown error
  return createError(
    ErrorType.UNKNOWN,
    error.message || "An unknown error occurred",
    error.code || "UNKNOWN_ERROR",
    error.details,
  )
}

// Format error message for display
export function formatErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      return "Authentication failed. Please log in again."
    case ErrorType.AUTHORIZATION:
      return "You don't have permission to perform this action."
    case ErrorType.VALIDATION:
      return `Invalid data: ${error.message}`
    case ErrorType.NOT_FOUND:
      return "The requested resource was not found."
    case ErrorType.SERVER:
      return "A server error occurred. Please try again later."
    case ErrorType.NETWORK:
      return "A network error occurred. Please check your connection."
    case ErrorType.UNKNOWN:
    default:
      return error.message || "An unknown error occurred."
  }
}

// Log error to monitoring service (placeholder)
export function logError(error: AppError, context?: any): void {
  // In a production app, this would send the error to a monitoring service like Sentry
  console.error("Error:", error, "Context:", context)
}
