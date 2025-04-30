"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { ArrowLeft, Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import {
  getNotificationPreferences,
  updateNotificationPreference,
  createDefaultNotificationPreferences,
  type NotificationPreference,
} from "@/lib/notification-service"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function NotificationPreferencesContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await getNotificationPreferences(user.id)

      if (error) {
        console.error("Error loading notification preferences:", error)
        setError("Failed to load notification preferences. Using default settings.")

        // Create default preferences if there's an error
        const defaultPrefs = [
          {
            id: "temp-pref-1",
            user_id: user.id,
            type: "order",
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "temp-pref-2",
            user_id: user.id,
            type: "payment",
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "temp-pref-3",
            user_id: user.id,
            type: "chat",
            email_enabled: false,
            push_enabled: true,
            in_app_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "temp-pref-4",
            user_id: user.id,
            type: "system",
            email_enabled: true,
            push_enabled: false,
            in_app_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "temp-pref-5",
            user_id: user.id,
            type: "delivery",
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        setPreferences(defaultPrefs)
        return
      }

      if (data && data.length > 0) {
        setPreferences(data)
      } else {
        // Create default preferences if none exist
        try {
          await createDefaultNotificationPreferences(user.id)
          const { data: newData } = await getNotificationPreferences(user.id)
          if (newData) {
            setPreferences(newData)
          } else {
            throw new Error("Failed to create default preferences")
          }
        } catch (createError) {
          console.error("Error creating default preferences:", createError)
          setError("Failed to create default preferences. Using temporary settings.")

          // Use default preferences if creation fails
          const defaultPrefs = [
            {
              id: "temp-pref-1",
              user_id: user.id,
              type: "order",
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "temp-pref-2",
              user_id: user.id,
              type: "payment",
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "temp-pref-3",
              user_id: user.id,
              type: "chat",
              email_enabled: false,
              push_enabled: true,
              in_app_enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "temp-pref-4",
              user_id: user.id,
              type: "system",
              email_enabled: true,
              push_enabled: false,
              in_app_enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "temp-pref-5",
              user_id: user.id,
              type: "delivery",
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]
          setPreferences(defaultPrefs)
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
      setError("Failed to load preferences. Using default settings.")

      // Use default preferences if loading fails
      const defaultPrefs = [
        {
          id: "temp-pref-1",
          user_id: user.id,
          type: "order",
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "temp-pref-2",
          user_id: user.id,
          type: "payment",
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "temp-pref-3",
          user_id: user.id,
          type: "chat",
          email_enabled: false,
          push_enabled: true,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "temp-pref-4",
          user_id: user.id,
          type: "system",
          email_enabled: true,
          push_enabled: false,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "temp-pref-5",
          user_id: user.id,
          type: "delivery",
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      setPreferences(defaultPrefs)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePreference = async (
    preferenceId: string,
    field: "email_enabled" | "push_enabled" | "in_app_enabled",
    value: boolean,
  ) => {
    setIsSaving(true)
    try {
      const { success, error } = await updateNotificationPreference(preferenceId, {
        [field]: value,
      })

      if (error) {
        console.error("Error updating preference:", error)
        toast({
          title: "Error",
          description: "Failed to update notification preference. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (success) {
        // Update local state
        setPreferences((prev) => prev.map((pref) => (pref.id === preferenceId ? { ...pref, [field]: value } : pref)))

        toast({
          title: "Success",
          description: "Notification preference updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating preference:", error)
      toast({
        title: "Error",
        description: "Failed to update notification preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
      case "order":
        return "Order Updates"
      case "payment":
        return "Payment Updates"
      case "chat":
        return "Chat Messages"
      case "delivery":
        return "Delivery Updates"
      case "system":
        return "System Notifications"
      default:
        return type
    }
  }

  const getNotificationTypeDescription = (type: string): string => {
    switch (type) {
      case "order":
        return "Notifications about order status changes, confirmations, and rejections."
      case "payment":
        return "Notifications about payment status, confirmations, and failures."
      case "chat":
        return "Notifications about new messages from other users."
      case "delivery":
        return "Notifications about delivery status updates and assignments."
      case "system":
        return "Important system announcements and updates."
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <Button asChild variant="outline">
          <Link href="/notifications">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Notifications
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Your preferences will be saved temporarily and will reset when you reload the page.
          </p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Your Notification Settings</CardTitle>
          <CardDescription>Choose how and when you want to receive notifications from Retail Bandhu.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Loading preferences...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <TooltipProvider>
                <div className="grid grid-cols-4 gap-4 mb-2 px-4">
                  <div></div>
                  <div className="text-center text-sm font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          Email <Info className="ml-1 h-3 w-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Receive notifications via email</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-center text-sm font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          Push <Info className="ml-1 h-3 w-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Receive push notifications on your device</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-center text-sm font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          In-App <Info className="ml-1 h-3 w-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Receive notifications within the application</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <Separator />

                {preferences.map((preference) => (
                  <div key={preference.id}>
                    <div className="grid grid-cols-4 gap-4 items-center py-4 px-4">
                      <div>
                        <Label className="text-base font-medium">{getNotificationTypeLabel(preference.type)}</Label>
                        <p className="text-sm text-gray-500">{getNotificationTypeDescription(preference.type)}</p>
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={preference.email_enabled}
                          onCheckedChange={(checked) => handleTogglePreference(preference.id, "email_enabled", checked)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={preference.push_enabled}
                          onCheckedChange={(checked) => handleTogglePreference(preference.id, "push_enabled", checked)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={preference.in_app_enabled}
                          onCheckedChange={(checked) =>
                            handleTogglePreference(preference.id, "in_app_enabled", checked)
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Email notifications are sent to your registered email address. They are useful for important updates
                that you might want to reference later.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                Push notifications appear on your device even when you're not using the app. They are useful for
                time-sensitive updates.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">In-App Notifications</h3>
              <p className="text-sm text-gray-500">
                In-app notifications appear in the notification bell within the application. They are useful for updates
                while you're actively using the app.
              </p>
            </div>
          </div>
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
