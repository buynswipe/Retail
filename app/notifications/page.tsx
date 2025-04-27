"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Bell, CheckCircle, Trash2, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { deleteNotification } from "@/lib/notification-service"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function NotificationsContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  const [activeTab, setActiveTab] = useState("all")
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return "🛒"
      case "payment":
        return "💰"
      case "chat":
        return "💬"
      case "delivery":
        return "🚚"
      default:
        return "📢"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return

    try {
      const { success, error } = await deleteNotification(notificationToDelete)
      if (success) {
        toast({
          title: "Success",
          description: "Notification deleted successfully.",
        })
        await refreshNotifications()
      } else {
        throw error
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setNotificationToDelete(null)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.is_read
    return notification.type === activeTab
  })

  const getDashboardLink = () => {
    if (user?.role === "retailer") return "/retailer/dashboard"
    if (user?.role === "wholesaler") return "/wholesaler/dashboard"
    if (user?.role === "delivery") return "/delivery/dashboard"
    if (user?.role === "admin") return "/admin/dashboard"
    return "/"
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button asChild variant="outline">
          <Link href={getDashboardLink()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              All Notifications
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-2">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="order">Orders</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 divide-y">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? "bg-blue-50" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setNotificationToDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge
                          className={`${
                            notification.type === "order"
                              ? "bg-blue-500"
                              : notification.type === "payment"
                                ? "bg-green-500"
                                : notification.type === "delivery"
                                  ? "bg-orange-500"
                                  : notification.type === "chat"
                                    ? "bg-purple-500"
                                    : "bg-gray-500"
                          }`}
                        >
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                        {notification.priority === "high" && <Badge className="ml-2 bg-red-500">High Priority</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
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
