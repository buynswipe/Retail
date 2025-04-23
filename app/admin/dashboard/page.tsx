"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState([])
  const [platformSettings, setPlatformSettings] = useState({
    commission_percentage: 0,
    commission_gst_rate: 0,
    delivery_charge: 0,
    delivery_gst_rate: 0,
  })
  const [newSettings, setNewSettings] = useState({
    commission_percentage: 0,
    commission_gst_rate: 0,
    delivery_charge: 0,
    delivery_gst_rate: 0,
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRetailers: 0,
    totalWholesalers: 0,
    totalDeliveryPartners: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/unauthorized")
      return
    }

    async function fetchData() {
      setLoading(true)

      // Fetch pending users
      const { data: pendingUsersData, error: pendingUsersError } = await supabase
        .from("users")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false })

      if (pendingUsersError) {
        console.error("Error fetching pending users:", pendingUsersError)
      } else {
        setPendingUsers(pendingUsersData)
      }

      // Fetch platform settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("platform_settings")
        .select("*")
        .order("effective_from", { ascending: false })
        .limit(1)
        .single()

      if (settingsError) {
        console.error("Error fetching platform settings:", settingsError)
      } else if (settingsData) {
        setPlatformSettings(settingsData)
        setNewSettings(settingsData)
      }

      // Fetch statistics
      const { data: usersData } = await supabase.from("users").select("role")

      const { data: ordersData } = await supabase.from("orders").select("total_amount")

      const totalUsers = usersData?.length || 0
      const totalRetailers = usersData?.filter((u) => u.role === "retailer").length || 0
      const totalWholesalers = usersData?.filter((u) => u.role === "wholesaler").length || 0
      const totalDeliveryPartners = usersData?.filter((u) => u.role === "delivery").length || 0
      const totalOrders = ordersData?.length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      setStats({
        totalUsers,
        totalRetailers,
        totalWholesalers,
        totalDeliveryPartners,
        totalOrders,
        totalRevenue,
      })

      setLoading(false)
    }

    fetchData()
  }, [user, router])

  const handleApproveUser = async (userId) => {
    const { error } = await supabase.from("users").update({ is_approved: true }).eq("id", userId)

    if (error) {
      console.error("Error approving user:", error)
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      })
    } else {
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId))
      toast({
        title: "Success",
        description: "User approved successfully.",
      })
    }
  }

  const handleRejectUser = async (userId) => {
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      console.error("Error rejecting user:", error)
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      })
    } else {
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId))
      toast({
        title: "Success",
        description: "User rejected successfully.",
      })
    }
  }

  const handleSettingsChange = (e) => {
    const { name, value } = e.target
    setNewSettings((prev) => ({
      ...prev,
      [name]: Number.parseFloat(value),
    }))
  }

  const handleSaveSettings = async () => {
    const { error } = await supabase.from("platform_settings").insert({
      commission_percentage: newSettings.commission_percentage,
      commission_gst_rate: newSettings.commission_gst_rate,
      delivery_charge: newSettings.delivery_charge,
      delivery_gst_rate: newSettings.delivery_gst_rate,
      effective_from: new Date().toISOString(),
      created_by: user.id,
    })

    if (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } else {
      setPlatformSettings(newSettings)
      toast({
        title: "Success",
        description: "Settings saved successfully.",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Retailers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRetailers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Wholesalers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWholesalers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending-approvals" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="platform-settings">Platform Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>Approve or reject new user registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-center py-4">No pending approvals</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name || "N/A"}</TableCell>
                        <TableCell>{user.business_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                        </TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleApproveUser(user.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user.id)}>
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform-settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure commission rates, delivery charges, and GST rates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_percentage">Commission Percentage (%)</Label>
                    <Input
                      id="commission_percentage"
                      name="commission_percentage"
                      type="number"
                      step="0.01"
                      value={newSettings.commission_percentage}
                      onChange={handleSettingsChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission_gst_rate">Commission GST Rate (%)</Label>
                    <Input
                      id="commission_gst_rate"
                      name="commission_gst_rate"
                      type="number"
                      step="0.01"
                      value={newSettings.commission_gst_rate}
                      onChange={handleSettingsChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_charge">Delivery Charge (₹)</Label>
                    <Input
                      id="delivery_charge"
                      name="delivery_charge"
                      type="number"
                      step="0.01"
                      value={newSettings.delivery_charge}
                      onChange={handleSettingsChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_gst_rate">Delivery GST Rate (%)</Label>
                    <Input
                      id="delivery_gst_rate"
                      name="delivery_gst_rate"
                      type="number"
                      step="0.01"
                      value={newSettings.delivery_gst_rate}
                      onChange={handleSettingsChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Platform Revenue</CardTitle>
          <CardDescription>Total revenue generated through the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
