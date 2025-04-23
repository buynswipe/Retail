"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Bell, ArrowLeft, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notification-service"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function NotificationPreferencesContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [preferences, setPreferences] = useState({
    order_updates: true,
    payment_updates: true,
    delivery_updates: true,
    chat_messages: true,
    promotional: false,
    email_notifications: true,
    push_notifications: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getNotificationPreferences(user.id)
      if (error) {
        console.error("Error loading notification preferences:", error)
      } else if (data) {
        setPreferences({
          order_updates: data.order_updates ?? true,
          payment_updates: data.payment_updates ?? true,
          delivery_updates: data.delivery_updates ?? true,
          chat_messages: data.chat_messages ?? true,
          promotional: data.promotional ?? false,
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
        })
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { success, error } = await updateNotificationPreferences(user.id, preferences)
      if (!success) {
        throw error
      }

      toast({
        title: "Success",
        description: "Notification preferences saved successfully.",
      })
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

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
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <Button asChild variant="outline">
          <Link href={getDashboardLink()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Customize which notifications you want to receive and how you want to receive them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">Loading preferences...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-updates" className="font-medium">
                        Order Updates
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications about your order status changes</p>
                    </div>
                    <Switch
                      id="order-updates"
                      checked={preferences.order_updates}
                      onCheckedChange={() => handleToggle("order_updates")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="payment-updates" className="font-medium">
                        Payment Updates
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications about payment status changes</p>
                    </div>
                    <Switch
                      id="payment-updates"
                      checked={preferences.payment_updates}
                      onCheckedChange={() => handleToggle("payment_updates")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="delivery-updates" className="font-medium">
                        Delivery Updates
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications about delivery status changes</p>
                    </div>
                    <Switch
                      id="delivery-updates"
                      checked={preferences.delivery_updates}
                      onCheckedChange={() => handleToggle("delivery_updates")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chat-messages" className="font-medium">
                        Chat Messages
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications about new chat messages</p>
                    </div>
                    <Switch
                      id="chat-messages"
                      checked={preferences.chat_messages}
                      onCheckedChange={() => handleToggle("chat_messages")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotional" className="font-medium">
                        Promotional Notifications
                      </Label>
                      <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
                    </div>
                    <Switch
                      id="promotional"
                      checked={preferences.promotional}
                      onCheckedChange={() => handleToggle("promotional")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={() => handleToggle("email_notifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-500">Receive notifications in your browser or mobile app</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={preferences.push_notifications}
                      onCheckedChange={() => handleToggle("push_notifications")}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSavePreferences} disabled={isSaving} className="bg-blue-500 hover:bg-blue-600">
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}

export default function NotificationPreferencesPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <NotificationPreferencesContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
