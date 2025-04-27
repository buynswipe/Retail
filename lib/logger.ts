type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
}

class Logger {
  private static instance: Logger
  private logQueue: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL_MS = 10000 // 10 seconds
  private readonly MAX_QUEUE_SIZE = 100
  private readonly LOG_ENDPOINT = "/api/logs"
  private sessionId: string

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.setupFlushInterval()
    this.setupBeforeUnload()
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private setupFlushInterval(): void {
    if (typeof window !== "undefined") {
      this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS)
    }
  }

  private setupBeforeUnload(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush())
    }
  }

  private getCurrentUser(): string | undefined {
    // This would be replaced with actual user ID retrieval logic
    if (typeof localStorage !== "undefined") {
      try {
        const userData = localStorage.getItem("supabase.auth.token")
        if (userData) {
          const parsed = JSON.parse(userData)
          return parsed.user?.id
        }
      } catch (e) {
        // Silently fail if we can't get the user
      }
    }
    return undefined
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUser(),
      sessionId: this.sessionId,
    }

    this.logQueue.push(logEntry)

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      const consoleMethod = level === "debug" ? "log" : level
      console[consoleMethod as keyof Console](`[${level.toUpperCase()}] ${message}`, context || "")
    }

    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush()
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context)
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context)
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context)
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log("error", message, context)
  }

  public async flush(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logsToSend = [...this.logQueue]
    this.logQueue = []

    try {
      if (typeof window !== "undefined") {
        await fetch(this.LOG_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: logsToSend }),
        })
      }
    } catch (error) {
      // If sending fails, add logs back to the queue
      this.logQueue = [...logsToSend, ...this.logQueue].slice(0, this.MAX_QUEUE_SIZE)
      console.error("Failed to send logs:", error)
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

export const logger = Logger.getInstance()

// Global error handler
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logger.error("Uncaught error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
    })
  })
}

export default logger
