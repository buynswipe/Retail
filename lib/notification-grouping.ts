import type { Notification } from "./types"
import { groupNotifications } from "./notification-filter"

// Notification group types
export type NotificationGroup = {
  title: string
  notifications: Notification[]
  count: number
  unreadCount: number
}

/**
 * Create notification groups with additional metadata
 * @param notifications Array of notifications to group
 * @param groupBy Grouping criteria
 * @returns Array of notification groups with metadata
 */
export const createNotificationGroups = (
  notifications: Notification[],
  groupBy: "date" | "type" | "priority" = "date",
): NotificationGroup[] => {
  if (!notifications || !Array.isArray(notifications)) {
    return []
  }

  const grouped = groupNotifications(notifications, groupBy)

  // Convert grouped object to array of groups with metadata
  return Object.entries(grouped)
    .map(([title, groupNotifications]) => {
      const unreadCount = groupNotifications.filter((n) => !n.read).length

      return {
        title,
        notifications: groupNotifications,
        count: groupNotifications.length,
        unreadCount,
      }
    })
    .sort((a, b) => {
      // Sort groups by date (for date groups)
      if (groupBy === "date") {
        if (a.title === "Today") return -1
        if (b.title === "Today") return 1
        if (a.title === "Yesterday") return -1
        if (b.title === "Yesterday") return 1

        // For other dates, compare them
        const dateA = new Date(a.title)
        const dateB = new Date(b.title)

        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB.getTime() - dateA.getTime()
        }
      }

      // For non-date groups or invalid dates, sort by unread count
      return b.unreadCount - a.unreadCount
    })
}

/**
 * Get summary of notification groups
 * @param notifications Array of notifications
 * @returns Summary object with counts
 */
export const getNotificationSummary = (notifications: Notification[]) => {
  if (!notifications || !Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      byType: {},
      byPriority: {},
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Group by type
  const typeGroups = groupNotifications(notifications, "type")
  const byType: Record<string, { total: number; unread: number }> = {}

  Object.entries(typeGroups).forEach(([type, typeNotifications]) => {
    byType[type] = {
      total: typeNotifications.length,
      unread: typeNotifications.filter((n) => !n.read).length,
    }
  })

  // Group by priority
  const priorityGroups = groupNotifications(notifications, "priority")
  const byPriority: Record<string, { total: number; unread: number }> = {}

  Object.entries(priorityGroups).forEach(([priority, priorityNotifications]) => {
    byPriority[priority] = {
      total: priorityNotifications.length,
      unread: priorityNotifications.filter((n) => !n.read).length,
    }
  })

  return {
    total: notifications.length,
    unread: unreadCount,
    byType,
    byPriority,
  }
}

/**
 * Batch mark notifications as read/unread
 * @param notifications Array of notifications
 * @param notificationIds IDs of notifications to update
 * @param read Read status to set
 * @returns Updated notifications array
 */
export const batchUpdateNotificationReadStatus = (
  notifications: Notification[],
  notificationIds: string[],
  read: boolean,
): Notification[] => {
  if (!notifications || !Array.isArray(notifications)) {
    return []
  }

  return notifications.map((notification) => {
    if (notificationIds.includes(notification.id)) {
      return { ...notification, read }
    }
    return notification
  })
}
