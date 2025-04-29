import type { Notification } from "./types"

// Notification filter types
export type NotificationFilterOptions = {
  read?: boolean
  unread?: boolean
  priority?: "high" | "medium" | "low" | "all"
  type?: string[]
  startDate?: Date
  endDate?: Date
  search?: string
}

/**
 * Filter notifications based on provided options
 * @param notifications Array of notifications to filter
 * @param options Filter options
 * @returns Filtered notifications array
 */
export const filterNotifications = (
  notifications: Notification[],
  options: NotificationFilterOptions = {},
): Notification[] => {
  if (!notifications || !Array.isArray(notifications)) {
    return []
  }

  return notifications.filter((notification) => {
    // Filter by read/unread status
    if (options.read !== undefined && notification.read !== options.read) {
      return false
    }

    if (options.unread !== undefined && notification.read === options.unread) {
      return false
    }

    // Filter by priority
    if (options.priority && options.priority !== "all") {
      if (notification.priority !== options.priority) {
        return false
      }
    }

    // Filter by notification type
    if (options.type && options.type.length > 0) {
      if (!options.type.includes(notification.type)) {
        return false
      }
    }

    // Filter by date range
    if (options.startDate) {
      const notificationDate = new Date(notification.createdAt)
      if (notificationDate < options.startDate) {
        return false
      }
    }

    if (options.endDate) {
      const notificationDate = new Date(notification.createdAt)
      if (notificationDate > options.endDate) {
        return false
      }
    }

    // Filter by search term
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      const titleMatch = notification.title?.toLowerCase().includes(searchLower)
      const bodyMatch = notification.body?.toLowerCase().includes(searchLower)

      if (!titleMatch && !bodyMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort notifications by specified criteria
 * @param notifications Array of notifications to sort
 * @param sortBy Sort criteria
 * @param sortOrder Sort order
 * @returns Sorted notifications array
 */
export const sortNotifications = (
  notifications: Notification[],
  sortBy: "date" | "priority" | "type" = "date",
  sortOrder: "asc" | "desc" = "desc",
): Notification[] => {
  if (!notifications || !Array.isArray(notifications)) {
    return []
  }

  const sortedNotifications = [...notifications]

  sortedNotifications.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "date":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case "priority":
        const priorityMap: Record<string, number> = {
          high: 3,
          medium: 2,
          low: 1,
        }
        comparison = (priorityMap[a.priority] || 0) - (priorityMap[b.priority] || 0)
        break
      case "type":
        comparison = (a.type || "").localeCompare(b.type || "")
        break
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  return sortedNotifications
}

/**
 * Group notifications by specified criteria
 * @param notifications Array of notifications to group
 * @param groupBy Grouping criteria
 * @returns Grouped notifications object
 */
export const groupNotifications = (
  notifications: Notification[],
  groupBy: "date" | "type" | "priority" = "date",
): Record<string, Notification[]> => {
  if (!notifications || !Array.isArray(notifications)) {
    return {}
  }

  const grouped: Record<string, Notification[]> = {}

  notifications.forEach((notification) => {
    let key: string

    switch (groupBy) {
      case "date": {
        const date = new Date(notification.createdAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
          key = "Today"
        } else if (date.toDateString() === yesterday.toDateString()) {
          key = "Yesterday"
        } else {
          key = date.toLocaleDateString()
        }
        break
      }
      case "type":
        key = notification.type || "Other"
        break
      case "priority":
        key = notification.priority || "None"
        break
      default:
        key = "Other"
    }

    if (!grouped[key]) {
      grouped[key] = []
    }

    grouped[key].push(notification)
  })

  return grouped
}
