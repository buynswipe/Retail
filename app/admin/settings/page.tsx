"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import Navbar from "@/app/components/navbar"
import ProtectedRoute from "@/app/components/protected-route"
import { errorHandler } from "@/lib/error-handler"
import type { PlatformSettings } from "@/lib/types"

export default function AdminSettings() {
  // State management
  const [settings, setSettings] = useState<PlatformSettings>({
    id: 1,
    commission_percentage: 2,
    commission_gst_rate: 18,
    delivery_charge: 50,
    delivery_gst_rate: 18,
    effective_from: new Date().toISOString(),
    created_by: "admin",
  })
  const [settingsHistory, setSettingsHistory] = useState<PlatformSettings[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Load settings from the database
  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch from Supabase
      // For now, we'll use mock data
      setTimeout(() => {
        setSettings({
          id: 1,
          commission_percentage: 2,
          commission_gst_rate: 18,
          delivery_charge: 50,
          delivery_gst_rate: 18,
          effective_from: new Date().toISOString(),
          created_by: "admin",
        })

        setSettingsHistory([
          {
            id: 1,
            commission_percentage: 2,
            commission_gst_rate: 18,
            delivery_charge: 50,
            delivery_gst_rate: 18,
            effective_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            created_by: "admin",
          },
        ])

        setIsLoading(false)
      }, 1000)
    } catch (error) {
      errorHandler(error, "Failed to load settings")
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Handle input change for settings
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      [name]: Number.parseFloat(value),
    })
  }

  // Save platform settings
  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // In a real app, this would save to Supabase
      setTimeout(() => {
        const newSettings = {
          ...settings,
          id: settingsHistory.length + 1,
          effective_from: new Date().toISOString(),
        }

        setSettingsHistory([...settingsHistory, newSettings])
        setSettings(newSettings)

        toast({
          title: "Success",
          description: "Platform settings saved successfully.",
        })

        setIsSaving(false)
      }, 1000)
    } catch (error) {
      errorHandler(error, "Failed to save settings")
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Platform Settings</h1>
              <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Configure Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="commission_percentage" className="text-lg">
                          Commission Percentage (0-10%)
                        </Label>
                        <Input
                          id="commission_percentage"
                          name="commission_percentage"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={settings.commission_percentage}
                          onChange={handleInputChange}
                          className="text-lg h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commission_gst_rate" className="text-lg">
                          Commission GST Rate (%)
                        </Label>
                        <Input
                          id="commission_gst_rate"
                          name="commission_gst_rate"
                          type="number"
                          min="0"
                          max="28"
                          value={settings.commission_gst_rate}
                          onChange={handleInputChange}
                          className="text-lg h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery_charge" className="text-lg">
                          Delivery Charge (₹)
                        </Label>
                        <Input
                          id="delivery_charge"
                          name="delivery_charge"
                          type="number"
                          min="0"
                          max="500"
                          value={settings.delivery_charge}
                          onChange={handleInputChange}
                          className="text-lg h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delivery_gst_rate" className="text-lg">
                          Delivery GST Rate (%)
                        </Label>
                        <Input
                          id="delivery_gst_rate"
                          name="delivery_gst_rate"
                          type="number"
                          min="0"
                          max="28"
                          value={settings.delivery_gst_rate}
                          onChange={handleInputChange}
                          className="text-lg h-12"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveSettings}
                      className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>

                    <div className="mt-8">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <h3 className="text-xl font-medium">Rate History</h3>
                        {showHistory ? <ChevronUp /> : <ChevronDown />}
                      </div>

                      {showHistory && (
                        <div className="rounded-md border mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Commission %</TableHead>
                                <TableHead>Commission GST</TableHead>
                                <TableHead>Delivery Charge</TableHead>
                                <TableHead>Delivery GST</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {settingsHistory.length > 0 ? (
                                settingsHistory.map((setting) => (
                                  <TableRow key={setting.id}>
                                    <TableCell>{new Date(setting.effective_from).toLocaleDateString()}</TableCell>
                                    <TableCell>{setting.commission_percentage}%</TableCell>
                                    <TableCell>{setting.commission_gst_rate}%</TableCell>
                                    <TableCell>₹{setting.delivery_charge}</TableCell>
                                    <TableCell>{setting.delivery_gst_rate}%</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="h-24 text-center">
                                    <p className="text-muted-foreground">No history available.</p>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
