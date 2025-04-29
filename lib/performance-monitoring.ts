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
    }, 0)
  })
}

// Observe largest contentful paint
function observeLCP() {
  const observer = new PerformanceObserver((entryList) => {
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
  })

  observer.observe({ type: "largest-contentful-paint", buffered: true })
}

// Observe first input delay
function observeFID() {
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()

    for (const entry of entries) {
      const metrics = {
        page: window.location.pathname,
        value: entry.processingStart - entry.startTime,
        event_type: (entry as any).name,
      }

      sendMetricsToServer("fid", metrics)
    }
  })

  observer.observe({ type: "first-input", buffered: true })
}

// Observe cumulative layout shift
function observeCLS() {
  let clsValue = 0
  const clsEntries = []

  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()

    for (const entry of entries) {
      // Only count layout shifts without recent user input
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value
        clsEntries.push(entry)
      }
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
}

// Observe resource timing
function observeResourceTiming() {
  const observer = new PerformanceObserver((entryList) => {
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
  })

  observer.observe({ type: "resource", buffered: true })
}

// Observe long tasks
function observeLongTasks() {
  const observer = new PerformanceObserver((entryList) => {
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
  })

  observer.observe({ type: "longtask", buffered: true })
}

// Observe memory usage
function observeMemoryUsage() {
  if (!("memory" in performance)) return

  // Check memory every 10 seconds
  setInterval(() => {
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
  }, 10000)
}

// Send metrics to server
async function sendMetricsToServer(metricType: string, metrics: any) {
  try {
    // Add user agent and timestamp
    metrics.user_agent = navigator.userAgent
    metrics.timestamp = new Date().toISOString()

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

    if (!response.ok) {
      console.error("Failed to send metrics:", response.statusText)
    }
  } catch (error) {
    console.error("Error sending metrics:", error)
  }
}
