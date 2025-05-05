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

/**
 * Enhanced error logging that includes more context
 * @param error The error object
 * @param context Additional context about where the error occurred
 * @param user Optional user information
 */
export function enhancedErrorLogging(
  error: AppError | any,
  context?: any,
  user?: { id: string; role: string } | null,
): void {
  // In a production app, this would send to a monitoring service

  // Convert to AppError if not already
  const appError = error.type ? (error as AppError) : handleSupabaseError(error)

  // Add timestamp
  const timestamp = new Date().toISOString()

  // Create error report
  const errorReport = {
    timestamp,
    error: {
      type: appError.type,
      message: appError.message,
      code: appError.code,
      details: appError.details,
      stack: error instanceof Error ? error.stack : undefined,
    },
    context,
    user: user
      ? {
          id: user.id,
          role: user.role,
        }
      : undefined,
    environment: process.env.NODE_ENV,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  }

  // Log to console for now
  console.error("Enhanced error report:", errorReport)

  // In production, you would send this to your error monitoring service
  // Example: sendToErrorMonitoring(errorReport);
}

/**
 * Determine if an error is recoverable
 * @param error The error to check
 * @returns boolean indicating if the error is potentially recoverable
 */
export function isRecoverableError(error: AppError | any): boolean {
  // Convert to AppError if not already
  const appError = error.type ? (error as AppError) : handleSupabaseError(error)

  switch (appError.type) {
    case ErrorType.NETWORK:
      // Network errors are often temporary
      return true
    case ErrorType.SERVER:
      // Server errors might resolve themselves
      return true
    case ErrorType.AUTHENTICATION:
      // Auth errors might be fixed by re-login
      return true
    case ErrorType.NOT_FOUND:
    case ErrorType.VALIDATION:
    case ErrorType.AUTHORIZATION:
      // These are usually not recoverable without changing the request
      return false
    case ErrorType.UNKNOWN:
    default:
      // Unknown errors - assume not recoverable
      return false
  }
}

/**
 * Get user-friendly recovery suggestions based on error type
 * @param error The error to get suggestions for
 * @returns Array of recovery suggestion strings
 */
export function getRecoverySuggestions(error: AppError | any): string[] {
  // Convert to AppError if not already
  const appError = error.type ? (error as AppError) : handleSupabaseError(error)

  switch (appError.type) {
    case ErrorType.NETWORK:
      return ["Check your internet connection", "Try again in a few moments", "Refresh the page"]
    case ErrorType.AUTHENTICATION:
      return ["Try logging in again", "Check if your session has expired"]
    case ErrorType.AUTHORIZATION:
      return ["You may not have permission for this action", "Contact support if you believe this is an error"]
    case ErrorType.VALIDATION:
      return ["Check the information you've entered", "Make sure all required fields are filled"]
    case ErrorType.SERVER:
      return ["This is a temporary server issue", "Please try again later", "Contact support if the problem persists"]
    case ErrorType.NOT_FOUND:
      return ["The requested resource may have been moved or deleted", "Check the URL and try again"]
    case ErrorType.UNKNOWN:
    default:
      return ["Try refreshing the page", "Log out and log back in", "Contact support if the problem persists"]
  }
}

/**
 * Generic error handler function that can be used throughout the application
 * @param error The error object
 * @param message Optional custom error message
 * @param defaultReturn Optional default return value in case of error
 * @returns The default return value if provided, otherwise undefined
 */
export function errorHandler<T>(error: any, message: string, defaultReturn?: T): T {
  // Convert to AppError if not already
  const appError = error.type ? (error as AppError) : handleSupabaseError(error)

  // Log the error
  logError(appError, { message })

  // Display error message if in development
  if (process.env.NODE_ENV === "development") {
    console.error(`${message}:`, error)
  }

  // Return default value if provided
  return defaultReturn as T
}

/**
 * Enhanced error handler with recovery options
 * @param error The error object
 * @param message Optional custom error message
 * @param options Additional options for error handling
 * @returns Result with error information and recovery options
 */
export function enhancedErrorHandler<T>(
  error: any,
  message: string,
  options?: {
    defaultReturn?: T
    user?: { id: string; role: string } | null
    context?: any
  },
): {
  result: T | undefined
  error: AppError
  recoverable: boolean
  recoverySuggestions: string[]
} {
  // Convert to AppError if not already
  const appError = error.type ? (error as AppError) : handleSupabaseError(error)

  // Log the error with enhanced context
  enhancedErrorLogging(
    appError,
    {
      message,
      ...options?.context,
    },
    options?.user,
  )

  // Check if error is recoverable
  const recoverable = isRecoverableError(appError)

  // Get recovery suggestions
  const recoverySuggestions = getRecoverySuggestions(appError)

  // Return result with error information
  return {
    result: options?.defaultReturn as T,
    error: appError,
    recoverable,
    recoverySuggestions,
  }
}
