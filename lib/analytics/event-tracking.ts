import { supabase } from "../supabase-client"

// Event types for strong typing
export type EventType =
  | "page_view"
  | "button_click"
  | "form_submit"
  | "form_error"
  | "search"
  | "filter_change"
  | "sort_change"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_start"
  | "checkout_complete"
  | "login"
  | "signup"
  | "product_view"
  | "error"

// Event properties interface
export interface EventProperties {
  [key: string]: string | number | boolean | null
}

// Track user events
export async function trackEvent(
  userId: string | null,
  sessionId: string,
  eventType: EventType,
  properties: EventProperties = {},
) {
  try {
    // Add basic properties
    const eventData = {
      user_id: userId,
      session_id: sessionId,
      event_type: eventType,
      properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    }

    // Store event in IndexedDB if offline
    if (typeof window !== "undefined" && !navigator.onLine) {
      const { storeOfflineEvent } = await import("./offline-events")
      await storeOfflineEvent(eventData)
      return
    }

    // Send to Supabase
    const { error } = await supabase.from("analytics_events").insert(eventData)

    if (error) {
      console.error("Error tracking event:", error)

      // Store failed events for retry
      if (typeof window !== "undefined") {
        const { storeOfflineEvent } = await import("./offline-events")
        await storeOfflineEvent(eventData)
      }
    }
  } catch (error) {
    console.error("Error in trackEvent:", error)
  }
}

// Initialize session ID
export function getSessionId(): string {
  if (typeof window === "undefined") return "server-side"

  let sessionId = sessionStorage.getItem("rb_session_id")

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem("rb_session_id", sessionId)
  }

  return sessionId
}

// Track page views automatically
export function initPageViewTracking(userId: string | null) {
  if (typeof window === "undefined") return

  const sessionId = getSessionId()

  // Track initial page view
  trackEvent(userId, sessionId, "page_view", {
    title: document.title,
    path: window.location.pathname,
  })

  // Track subsequent page views (for client-side navigation)
  if (typeof history !== "undefined") {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function () {
      originalPushState.apply(this, arguments as any)
      setTimeout(() => {
        trackEvent(userId, sessionId, "page_view", {
          title: document.title,
          path: window.location.pathname,
        })
      }, 0)
    }

    history.replaceState = function () {
      originalReplaceState.apply(this, arguments as any)
      setTimeout(() => {
        trackEvent(userId, sessionId, "page_view", {
          title: document.title,
          path: window.location.pathname,
        })
      }, 0)
    }

    window.addEventListener("popstate", () => {
      setTimeout(() => {
        trackEvent(userId, sessionId, "page_view", {
          title: document.title,
          path: window.location.pathname,
        })
      }, 0)
    })
  }
}
