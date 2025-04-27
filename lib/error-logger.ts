// Simple client-side error logger

const logError = (error: Error, context?: Record<string, any>) => {
  // Log to console in development
  console.error("Application error:", error, context)

  // In production, we could send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    try {
      // Send to our error tracking API
      fetch("/api/error-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context: {
            ...context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch((e) => console.error("Failed to log error:", e))
    } catch (e) {
      console.error("Error while logging error:", e)
    }
  }
}

// Set up global error handlers
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logError(event.error || new Error(event.message), {
      type: "uncaught error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    logError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      type: "unhandled rejection",
    })
  })
}

export { logError }
