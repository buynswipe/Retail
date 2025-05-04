// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === "undefined") return

  // Skip in development
  if (process.env.NODE_ENV === "development") return

  // Observe navigation timing
  observeNavigationTiming()

  // Observe largest contentful paint
  observeLCP()

  // Observe first input delay
  observeFID()

  // Observe cumulative layout shift
  observeCLS()

  // Observe resource timing
  observeResourceTiming()

  // Observe long tasks
  observeLongTasks()

  // Observe memory usage
  observeMemoryUsage()
}

// Observe navigation timing
function observeNavigationTiming() {
  window.addEventListener("load", () => {
    setTimeout(() => {
      try {
        const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

        if (!navigationEntry) return

        const metrics = {
          page: window.location.pathname,
          dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
          tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
          request: navigationEntry.responseStart - navigationEntry.requestStart,
          response: navigationEntry.responseEnd - navigationEntry.responseStart,
          dom_processing: navigationEntry.domComplete - navigationEntry.responseEnd,
          dom_interactive: navigationEntry.domInteractive - navigationEntry.fetchStart,
          dom_complete: navigationEntry.domComplete - navigationEntry.fetchStart,
          load_event: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
          time_to_interactive: navigationEntry.domInteractive - navigationEntry.fetchStart,
          first_byte: navigationEntry.responseStart - navigationEntry.fetchStart,
          first_contentful_paint: 0, // Will be populated later
        }

        // Get first contentful paint
        const paintEntries = performance.getEntriesByType("paint")
        const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")

        if (fcpEntry) {
          metrics.first_contentful_paint = fcpEntry.startTime
        }

        // Send metrics to server
        sendMetricsToServer("navigation", metrics)
      } catch (error) {
        console.error("Error observing navigation timing:", error)
      }
    }, 0)
  })
}

// Observe largest contentful paint
function observeLCP() {
  try {
    const observer = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]

        if (lastEntry) {
          const metrics = {
            page: window.location.pathname,
            value: lastEntry.startTime,
            size: (lastEntry as any).size || 0,
            element: (lastEntry as any).element ? (lastEntry as any).element.tagName : null,
          }

          sendMetricsToServer("lcp", metrics)
        }
      } catch (error) {
        console.error("Error processing LCP entries:", error)
      }
    })

    observer.observe({ type: "largest-contentful-paint", buffered: true })
  } catch (error) {
    console.error("Error setting up LCP observer:", error)
  }
}

// Observe first input delay
function observeFID() {
  try {
    const observer = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          const metrics = {
            page: window.location.pathname,
            value: entry.processingStart - entry.startTime,
            event_type: (entry as any).name,
          }

          sendMetricsToServer("fid", metrics)
        }
      } catch (error) {
        console.error("Error processing FID entries:", error)
      }
    })

    observer.observe({ type: "first-input", buffered: true })
  } catch (error) {
    console.error("Error setting up FID observer:", error)
  }
}

// Observe cumulative layout shift
function observeCLS() {
  try {
    let clsValue = 0
    const clsEntries = []

    const observer = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            clsEntries.push(entry)
          }
        }
      } catch (error) {
        console.error("Error processing CLS entries:", error)
      }
    })

    observer.observe({ type: "layout-shift", buffered: true })

    // Report CLS when the page is hidden or unloaded
    function reportCLS() {
      if (clsEntries.length === 0) return

      const metrics = {
        page: window.location.pathname,
        value: clsValue,
        entries: clsEntries.length,
      }

      sendMetricsToServer("cls", metrics)
    }

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportCLS()
      }
    })

    window.addEventListener("beforeunload", reportCLS)
  } catch (error) {
    console.error("Error setting up CLS observer:", error)
  }
}

// Observe resource timing
function observeResourceTiming() {
  try {
    const observer = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          // Filter out non-important resources
          if (
            entry.initiatorType === "fetch" ||
            entry.initiatorType === "xmlhttprequest" ||
            entry.initiatorType === "script" ||
            entry.initiatorType === "css" ||
            entry.initiatorType === "img"
          ) {
            const metrics = {
              page: window.location.pathname,
              resource_url: entry.name,
              initiator_type: entry.initiatorType,
              duration: entry.duration,
              transfer_size: (entry as any).transferSize || 0,
              encoded_body_size: (entry as any).encodedBodySize || 0,
            }

            sendMetricsToServer("resource", metrics)
          }
        }
      } catch (error) {
        console.error("Error processing resource entries:", error)
      }
    })

    observer.observe({ type: "resource", buffered: true })
  } catch (error) {
    console.error("Error setting up resource observer:", error)
  }
}

// Observe long tasks
function observeLongTasks() {
  try {
    const observer = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          const metrics = {
            page: window.location.pathname,
            duration: entry.duration,
            start_time: entry.startTime,
            attribution: (entry as any).attribution ? JSON.stringify((entry as any).attribution) : null,
          }

          sendMetricsToServer("long_task", metrics)
        }
      } catch (error) {
        console.error("Error processing long task entries:", error)
      }
    })

    observer.observe({ type: "longtask", buffered: true })
  } catch (error) {
    console.error("Error setting up long task observer:", error)
  }
}

// Observe memory usage
function observeMemoryUsage() {
  if (!("memory" in performance)) return

  // Check memory every 10 seconds
  setInterval(() => {
    try {
      const memory = (performance as any).memory

      if (memory) {
        const metrics = {
          page: window.location.pathname,
          used_js_heap_size: memory.usedJSHeapSize,
          total_js_heap_size: memory.totalJSHeapSize,
          js_heap_size_limit: memory.jsHeapSizeLimit,
        }

        sendMetricsToServer("memory", metrics)
      }
    } catch (error) {
      console.error("Error observing memory usage:", error)
    }
  }, 10000)
}

// Send metrics to server
async function sendMetricsToServer(metricType: string, metrics: any) {
  try {
    // Add user agent and timestamp
    metrics.user_agent = navigator.userAgent
    metrics.timestamp = new Date().toISOString()

    // Implement retry logic with exponential backoff
    let retries = 0
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    while (retries <= maxRetries) {
      try {
        // Send to server
        const response = await fetch("/api/analytics/vitals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: metricType,
            metrics,
          }),
          // Use keepalive to ensure the request completes even if the page is unloaded
          keepalive: true,
        })

        if (response.ok) {
          // Success, exit retry loop
          return
        }

        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.warn(
          `Failed to send ${metricType} metrics (attempt ${retries + 1}/${maxRetries + 1}):`,
          errorData.error,
        )
      } catch (fetchError) {
        console.warn(`Error sending ${metricType} metrics (attempt ${retries + 1}/${maxRetries + 1}):`, fetchError)
      }

      // Exponential backoff
      retries++
      if (retries <= maxRetries) {
        const delay = baseDelay * Math.pow(2, retries - 1) + Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    console.error(`Failed to send ${metricType} metrics after ${maxRetries + 1} attempts`)
  } catch (error) {
    console.error(`Error in sendMetricsToServer for ${metricType}:`, error)
  }
}
