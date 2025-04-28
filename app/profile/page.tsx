"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useSafeTranslation } from "@/lib/use-safe-translation"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getUserProfile, updateUserProfile } from "@/lib/user-service"
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notification-service"
import { User, Store, MapPin, Phone, Mail, CreditCard, Bell, Shield, LogOut, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

// Add a static export configuration to skip static generation
export const dynamic = "force-dynamic"

export default function ProfilePage() {
  // Use our safe translation hook instead
  const { t, isMounted } = useSafeTranslation()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("personal")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    business_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst_number: "",
    profile_image: "",
  })

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    order_updates: true,
    payment_updates: true,
    inventory_alerts: true,
    marketing_messages: false,
  })

  useEffect(() => {
    // Skip loading data during server-side rendering
    if (!isMounted) return

    const loadUserData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Load profile
        const { data: profileData, error: profileError } = await getUserProfile(user.id)
        if (profileError) throw profileError
        setProfile(profileData || {})

        // Load notification preferences
        const { data: prefsData, error: prefsError } = await getNotificationPreferences(user.id)
        if (prefsError) throw prefsError
        setNotificationPrefs(prefsData || {})
      } catch (error) {
        console.error("Failed to load user data:", error)
        toast({
          title: "Error",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user, isMounted])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationPrefChange = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { success, error } = await updateUserProfile(user.id, profile)
      if (error) throw error

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotificationPrefs = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { success, error } = await updateNotificationPreferences(user.id, notificationPrefs)
      if (error) throw error

      toast({
        title: "Success",
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update your notification preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect will happen automatically via auth context
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show a loading state during server-side rendering
  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">{t("Please log in to view your profile")}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden mb-4">
                      {profile.profile_image ? (
                        <Image
                          src={profile.profile_image || "/placeholder.svg"}
                          alt={profile.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          {user.role === "retailer" || user.role === "wholesaler" ? (
                            <Store className="h-12 w-12 text-gray-400" />
                          ) : (
                            <User className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold">{profile.name || user.id}</h2>
                    <p className="text-sm text-gray-500 mb-2">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      {t("Upload Photo")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                  <TabsTrigger
                    value="personal"
                    className="justify-start px-3 py-2 h-auto data-[state=active]:bg-gray-100"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t("Personal Information")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="business"
                    className="justify-start px-3 py-2 h-auto data-[state=active]:bg-gray-100"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    {t("Business Information")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="justify-start px-3 py-2 h-auto data-[state=active]:bg-gray-100"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {t("Notification Settings")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="justify-start px-3 py-2 h-auto data-[state=active]:bg-gray-100"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t("Security")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="outline" className="w-full text-red-600" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("Logout")}
              </Button>
            </div>

            {/* Profile Content */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : activeTab === "personal" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {t("Personal Information")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">{t("Full Name")}</Label>
                        <div className="flex mt-1">
                          <User className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                          <Input
                            id="name"
                            name="name"
                            value={profile.name || ""}
                            onChange={handleProfileChange}
                            placeholder={t("Enter your full name")}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">{t("Email Address")}</Label>
                        <div className="flex mt-1">
                          <Mail className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email || ""}
                            onChange={handleProfileChange}
                            placeholder={t("Enter your email address")}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">{t("Phone Number")}</Label>
                        <div className="flex mt-1">
                          <Phone className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                          <Input
                            id="phone"
                            name="phone"
                            value={profile.phone || ""}
                            onChange={handleProfileChange}
                            placeholder={t("Enter your phone number")}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">{t("Address")}</Label>
                      <div className="flex mt-1">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                        <Textarea
                          id="address"
                          name="address"
                          value={profile.address || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your address")}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="city">{t("City")}</Label>
                        <Input
                          id="city"
                          name="city"
                          value={profile.city || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your city")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">{t("State")}</Label>
                        <Input
                          id="state"
                          name="state"
                          value={profile.state || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your state")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">{t("Pincode")}</Label>
                        <Input
                          id="pincode"
                          name="pincode"
                          value={profile.pincode || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your pincode")}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? t("Saving...") : t("Save Changes")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === "business" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      {t("Business Information")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="business_name">{t("Business Name")}</Label>
                      <div className="flex mt-1">
                        <Store className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                        <Input
                          id="business_name"
                          name="business_name"
                          value={profile.business_name || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your business name")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="gst_number">{t("GST Number")}</Label>
                      <div className="flex mt-1">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                        <Input
                          id="gst_number"
                          name="gst_number"
                          value={profile.gst_number || ""}
                          onChange={handleProfileChange}
                          placeholder={t("Enter your GST number")}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("Your GST number is required for billing and tax purposes")}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? t("Saving...") : t("Save Changes")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === "notifications" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      {t("Notification Settings")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t("Email Notifications")}</p>
                          <p className="text-sm text-gray-500">{t("Receive notifications via email")}</p>
                        </div>
                        <Switch
                          checked={notificationPrefs.email_notifications}
                          onCheckedChange={() => handleNotificationPrefChange("email_notifications")}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t("Push Notifications")}</p>
                          <p className="text-sm text-gray-500">{t("Receive notifications on your device")}</p>
                        </div>
                        <Switch
                          checked={notificationPrefs.push_notifications}
                          onCheckedChange={() => handleNotificationPrefChange("push_notifications")}
                        />
                      </div>

                      <div className="border-t pt-4">
                        <p className="font-medium mb-4">{t("Notification Types")}</p>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t("Order Updates")}</p>
                              <p className="text-sm text-gray-500">
                                {t("Notifications about your orders and their status")}
                              </p>
                            </div>
                            <Switch
                              checked={notificationPrefs.order_updates}
                              onCheckedChange={() => handleNotificationPrefChange("order_updates")}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t("Payment Updates")}</p>
                              <p className="text-sm text-gray-500">
                                {t("Notifications about payments and transactions")}
                              </p>
                            </div>
                            <Switch
                              checked={notificationPrefs.payment_updates}
                              onCheckedChange={() => handleNotificationPrefChange("payment_updates")}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t("Inventory Alerts")}</p>
                              <p className="text-sm text-gray-500">
                                {t("Notifications about low stock and inventory changes")}
                              </p>
                            </div>
                            <Switch
                              checked={notificationPrefs.inventory_alerts}
                              onCheckedChange={() => handleNotificationPrefChange("inventory_alerts")}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t("Marketing Messages")}</p>
                              <p className="text-sm text-gray-500">
                                {t("Promotional offers, discounts, and marketing updates")}
                              </p>
                            </div>
                            <Switch
                              checked={notificationPrefs.marketing_messages}
                              onCheckedChange={() => handleNotificationPrefChange("marketing_messages")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveNotificationPrefs} disabled={isSaving}>
                        {isSaving ? t("Saving...") : t("Save Preferences")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      {t("Security")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">{t("Change Password")}</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="current-password">{t("Current Password")}</Label>
                          <Input id="current-password" type="password" placeholder={t("Enter your current password")} />
                        </div>
                        <div>
                          <Label htmlFor="new-password">{t("New Password")}</Label>
                          <Input id="new-password" type="password" placeholder={t("Enter your new password")} />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">{t("Confirm New Password")}</Label>
                          <Input id="confirm-password" type="password" placeholder={t("Confirm your new password")} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">{t("Two-Factor Authentication")}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {t("Add an extra layer of security to your account")}
                      </p>
                      <Button variant="outline">{t("Enable Two-Factor Authentication")}</Button>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">{t("Login Sessions")}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {t("Manage your active sessions and sign out from other devices")}
                      </p>
                      <Button variant="outline" className="text-red-600">
                        {t("Sign Out From All Devices")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
