"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TranslationProvider } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import {
  Users,
  DollarSign,
  AlertCircle,
  Settings,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  BarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PlatformSettings, User } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<PlatformSettings>({
    id: 1,
    commission_percentage: 2,
    commission_gst_rate: 18,
    delivery_charge: 50,
    delivery_gst_rate: 18,
    effective_from: new Date().toISOString(),
    created_by: "admin",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [settingsHistory, setSettingsHistory] = useState<PlatformSettings[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const router = useRouter()

  // Simulate loading data from Supabase
  useEffect(() => {
    // Mock users data
    const mockUsers: User[] = [
      {
        id: "1",
        phone_number: "9876543210",
        role: "retailer",
        name: "Raj Kumar",
        business_name: "Raj Grocery Store",
        pin_code: "400001",
        is_approved: true,
        created_at: "2023-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        phone_number: "9876543211",
        role: "wholesaler",
        name: "Vikram Singh",
        business_name: "Vikram Wholesale",
        pin_code: "400002",
        gst_number: "GST1234567890",
        bank_account_number: "12345678901",
        bank_ifsc: "SBIN0001234",
        is_approved: true,
        created_at: "2023-01-02T00:00:00.000Z",
      },
      {
        id: "3",
        phone_number: "9876543212",
        role: "delivery",
        name: "Suresh Patel",
        pin_code: "400003",
        vehicle_type: "bike",
        bank_account_number: "09876543210",
        bank_ifsc: "HDFC0000123",
        is_approved: false,
        created_at: "2023-01-03T00:00:00.000Z",
      },
    ]

    const mockSettingsHistory: PlatformSettings[] = [
      {
        id: 0,
        commission_percentage: 1.5,
        commission_gst_rate: 18,
        delivery_charge: 40,
        delivery_gst_rate: 18,
        effective_from: "2023-01-01T00:00:00.000Z",
        created_by: "admin",
      },
      {
        id: 1,
        commission_percentage: 2,
        commission_gst_rate: 18,
        delivery_charge: 50,
        delivery_gst_rate: 18,
        effective_from: new Date().toISOString(),
        created_by: "admin",
      },
    ]

    setUsers(mockUsers)
    setSettingsHistory(mockSettingsHistory)
  }, [])

  const handleApprove = async (userId: string) => {
    // In a real app, this would update the user in Supabase
    setUsers(users.map((user) => (user.id === userId ? { ...user, is_approved: true } : user)))
  }

  const handleBlock = async (userId: string) => {
    // In a real app, this would update the user in Supabase
    setUsers(users.map((user) => (user.id === userId ? { ...user, is_approved: false } : user)))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    // In a real app, this would save to Supabase
    setTimeout(() => {
      const newSettings = {
        ...settings,
        id: settingsHistory.length + 1,
        effective_from: new Date().toISOString(),
      }

      setSettingsHistory([...settingsHistory, newSettings])
      setSettings(newSettings)
      setIsLoading(false)
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      [name]: Number.parseFloat(value),
    })
  }

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Analytics</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">System Metrics</div>
                <p className="text-xs text-muted-foreground">Comprehensive platform insights</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/analytics" className="w-full">
                  <Button className="w-full">View Analytics</Button>
                </Link>
              </CardFooter>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-8">
                <TabsTrigger value="users" className="text-lg py-3">
                  <Users className="mr-2 h-5 w-5" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="transactions" className="text-lg py-3">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="disputes" className="text-lg py-3">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Disputes
                </TabsTrigger>
                <TabsTrigger value="tax" className="text-lg py-3">
                  <FileText className="mr-2 h-5 w-5" />
                  Tax
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-lg py-3">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Business Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>{user.phone_number}</TableCell>
                            <TableCell>{user.business_name || "-"}</TableCell>
                            <TableCell>
                              {user.is_approved ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {!user.is_approved ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(user.id)}
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="destructive" onClick={() => handleBlock(user.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Block
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl">Track and manage all platform transactions.</p>
                    <div className="p-8 text-center text-gray-500">
                      <p>Transaction data will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="disputes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Disputes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl">Manage and resolve user disputes.</p>
                    <div className="p-8 text-center text-gray-500">
                      <p>Dispute data will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Platform Tax Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end mb-4">
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                    <div className="p-8 text-center text-gray-500">
                      <p>Tax report data will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Settings"}
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
                        <Table className="mt-4">
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
                            {settingsHistory.map((setting) => (
                              <TableRow key={setting.id}>
                                <TableCell>{new Date(setting.effective_from).toLocaleDateString()}</TableCell>
                                <TableCell>{setting.commission_percentage}%</TableCell>
                                <TableCell>{setting.commission_gst_rate}%</TableCell>
                                <TableCell>₹{setting.delivery_charge}</TableCell>
                                <TableCell>{setting.delivery_gst_rate}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
