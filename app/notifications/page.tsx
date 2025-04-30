"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Bell, Trash2, CheckCircle, Filter, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/lib/notification-context"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDashboardPath } from "@/lib/navigation-utils"
import { useRouter } from "next/navigation"

function NotificationsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")

  // Filter notifications based on active tab and filter
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by read/unread status
    if (activeTab === "unread" && notification.is_read) return false
    if (activeTab === "read" && !notification.is_read) return false

    // Filter by notification type
    if (activeFilter !== "all" && notification.type !== activeFilter) return false

    return true
  })

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId)
  }

  // Handle back button click with error handling
  const handleBackClick = () => {
    try {
      const dashboardPath = getDashboardPath(user?.role, "/")
      router.push(dashboardPath)
    } catch (error) {
      console.error("Navigation error:", error)
      // Fallback to home page if there's an error
      router.push("/")
    }
  }

  // Get icon color based on notification type
  const getIconColor = (type: string): string => {
    switch (type) {
      case "order":
        return "text-blue-500 bg-blue-50"
      case "payment":
        return "text-green-500 bg-green-50"
      case "chat":
        return "text-purple-500 bg-purple-50"
      case "delivery":
        return "text-orange-500 bg-orange-50"
      case "system":
        return "text-gray-500 bg-gray-50"
      default:
        return "text-gray-500 bg-gray-50"
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

  // Format notification date
  const formatNotificationDate = (dateString: string): string => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  }

  // Get dashboard path safely
  const dashboardPath = getDashboardPath(user?.role, "/")

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/notification-preferences">Preferences</Link>
          </Button>
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Your Notifications</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveFilter("all")}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("order")}>Orders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("payment")}>Payments</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("delivery")}>Delivery</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("chat")}>Chat</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("system")}>System</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-lg ${!notification.is_read ? "bg-blue-50" : ""}`}
                >
                  <div className={`mt-0.5 rounded-full p-2 ${getIconColor(notification.type)}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getBadgeColor(notification.priority)}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                        {!notification.is_read && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatNotificationDate(notification.created_at)}</span>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    {notification.message_hindi && (
                      <p className="text-sm text-gray-500">{notification.message_hindi}</p>
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      {!notification.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications found</p>
              {activeTab !== "all" || activeFilter !== "all" ? (
                <Button
                  variant="link"
                  onClick={() => {
                    setActiveTab("all")
                    setActiveFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>
          Manage your notification preferences{" "}
          <Link href="/notification-preferences" className="text-blue-500 hover:underline">
            here
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <NotificationsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
