"use client"

import { useState } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { CreditCard, Wallet, IndianRupee, Bell, Shield, Settings } from "lucide-react"

interface PaymentSettingsProps {
  userId: string
  userType: "retailer" | "wholesaler"
}

export function PaymentSettings({ userId, userType }: PaymentSettingsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("payment-methods")
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enablePushNotifications: true,
    defaultPaymentMethod: "upi",
    saveCardInfo: false,
    autoPayEnabled: false,
    lowBalanceAlert: true,
    lowBalanceThreshold: 1000,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, you would save the settings to the database
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Settings Saved",
        description: "Your payment settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Payment Settings")}</CardTitle>
        <CardDescription>{t("Manage your payment preferences and settings")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="payment-methods">
              <CreditCard className="h-4 w-4 mr-2" />
              {t("Payment Methods")}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              {t("Notifications")}
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              {t("Security")}
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              {t("Preferences")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t("Credit/Debit Cards")}</p>
                    <p className="text-sm text-gray-500">{t("Visa, Mastercard, RuPay")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t("Manage")}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <img src="/UPI-symbol.png" alt="UPI" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{t("UPI")}</p>
                    <p className="text-sm text-gray-500">{t("Google Pay, PhonePe, Paytm")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t("Manage")}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t("Netbanking")}</p>
                    <p className="text-sm text-gray-500">{t("All major banks supported")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t("Manage")}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t("Wallets")}</p>
                    <p className="text-sm text-gray-500">{t("Paytm, Amazon Pay, MobiKwik")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t("Manage")}
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default-payment-method">{t("Default Payment Method")}</Label>
                    <p className="text-sm text-gray-500">{t("Choose your preferred payment method")}</p>
                  </div>
                  <select
                    id="default-payment-method"
                    className="border rounded-md p-2"
                    value={settings.defaultPaymentMethod}
                    onChange={(e) => handleSettingChange("defaultPaymentMethod", e.target.value)}
                  >
                    <option value="upi">{t("UPI")}</option>
                    <option value="card">{t("Credit/Debit Card")}</option>
                    <option value="netbanking">{t("Netbanking")}</option>
                    <option value="wallet">{t("Wallet")}</option>
                    <option value="cod">{t("Cash on Delivery")}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="save-card-info">{t("Save Card Information")}</Label>
                    <p className="text-sm text-gray-500">{t("Securely save your card details for faster checkout")}</p>
                  </div>
                  <Switch
                    id="save-card-info"
                    checked={settings.saveCardInfo}
                    onCheckedChange={(checked) => handleSettingChange("saveCardInfo", checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">{t("Email Notifications")}</Label>
                  <p className="text-sm text-gray-500">{t("Receive payment confirmations and receipts via email")}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("enableEmailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">{t("SMS Notifications")}</Label>
                  <p className="text-sm text-gray-500">{t("Receive payment alerts via SMS")}</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.enableSmsNotifications}
                  onCheckedChange={(checked) => handleSettingChange("enableSmsNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">{t("Push Notifications")}</Label>
                  <p className="text-sm text-gray-500">{t("Receive payment alerts on your device")}</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.enablePushNotifications}
                  onCheckedChange={(checked) => handleSettingChange("enablePushNotifications", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-pay">{t("Auto-Pay")}</Label>
                  <p className="text-sm text-gray-500">{t("Automatically pay for orders when they are confirmed")}</p>
                </div>
                <Switch
                  id="auto-pay"
                  checked={settings.autoPayEnabled}
                  onCheckedChange={(checked) => handleSettingChange("autoPayEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="low-balance-alert">{t("Low Balance Alert")}</Label>
                  <p className="text-sm text-gray-500">{t("Get notified when your balance is low")}</p>
                </div>
                <Switch
                  id="low-balance-alert"
                  checked={settings.lowBalanceAlert}
                  onCheckedChange={(checked) => handleSettingChange("lowBalanceAlert", checked)}
                />
              </div>

              {settings.lowBalanceAlert && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="low-balance-threshold">{t("Low Balance Threshold")}</Label>
                    <p className="text-sm text-gray-500">{t("Set the threshold for low balance alerts")}</p>
                  </div>
                  <Input
                    id="low-balance-threshold"
                    type="number"
                    className="w-24"
                    value={settings.lowBalanceThreshold}
                    onChange={(e) => handleSettingChange("lowBalanceThreshold", Number.parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency-preference">{t("Currency Preference")}</Label>
                <p className="text-sm text-gray-500 mb-2">{t("Choose your preferred currency for payments")}</p>
                <select id="currency-preference" className="border rounded-md p-2 w-full">
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <Label htmlFor="receipt-language">{t("Receipt Language")}</Label>
                <p className="text-sm text-gray-500 mb-2">{t("Choose language for payment receipts")}</p>
                <select id="receipt-language" className="border rounded-md p-2 w-full">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>

              <div>
                <Label htmlFor="receipt-format">{t("Receipt Format")}</Label>
                <p className="text-sm text-gray-500 mb-2">{t("Choose your preferred receipt format")}</p>
                <select id="receipt-format" className="border rounded-md p-2 w-full">
                  <option value="pdf">PDF</option>
                  <option value="email">Email</option>
                  <option value="both">Both PDF and Email</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? t("Saving...") : t("Save Settings")}
        </Button>
      </CardFooter>
    </Card>
  )
}
