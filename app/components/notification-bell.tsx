"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/lib/notification-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  // Get the 5 most recent notifications
  const recentNotifications = notifications.slice(0, 5)

  // Handle notification click
  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  // Get icon color based on notification type
  const getIconColor = (type: string): string => {
    switch (type) {
      case "order":
        return "text-blue-500"
      case "payment":
        return "text-green-500"
      case "chat":
        return "text-purple-500"
      case "delivery":
        return "text-orange-500"
      case "system":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  // Get badge color based on notification priority
  const getBadgeColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  // Format notification time
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true })
    } else {
      return format(date, "MMM d, yyyy")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <Link href="/notifications" className="text-xs text-blue-500 hover:underline" onClick={() => setOpen(false)}>
            View All
          </Link>
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {recentNotifications.length > 0 ? (
            <div className="space-y-1">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-2 p-3 hover:bg-gray-50 ${!notification.is_read ? "bg-blue-50" : ""}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className={`mt-0.5 rounded-full p-1 ${getIconColor(notification.type)}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge className={getBadgeColor(notification.priority)}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatNotificationTime(notification.created_at)}</span>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Link
            href="/notification-preferences"
            className="block w-full rounded-md p-2 text-center text-xs text-gray-500 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Manage Notification Preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
