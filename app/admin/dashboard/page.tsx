"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Users,
  DollarSign,
  AlertCircle,
  Settings,
  FileText,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserProfile } from "@/app/components/user-profile"
import { TranslationProvider } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import ProtectedRoute from "@/app/components/protected-route"
import { errorHandler } from "@/lib/error-handler"
import { getUsersByRole, updateUserApprovalStatus, getUserStatistics } from "@/lib/user-service"
import type { User, PlatformSettings } from "@/lib/types"

export default function AdminDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("users")
  const [activeUserTab, setActiveUserTab] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    total_users: 0,
    retailers: 0,
    wholesalers: 0,
    delivery_partners: 0,
    pending_approvals: 0,
  })
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "block" | "delete"
    userId: string
    userName: string
  } | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  // Load users and statistics on component mount
  useEffect(() => {
    loadUsers()
    loadUserStatistics()
  }, [])

  // Filter users when search term or active tab changes
  useEffect(() => {
    filterUsers()
  }, [searchTerm, activeUserTab, users])

  // Load users from the database
  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getUsersByRole(activeUserTab === "all" ? undefined : (activeUserTab as any))

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (error) {
      errorHandler(error, "Failed to load users", [])
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load user statistics
  const loadUserStatistics = async () => {
    try {
      const { data, error } = await getUserStatistics()

      if (error) {
        throw error
      }

      if (data) {
        setUserStats(data)
      }
    } catch (error) {
      errorHandler(error, "Failed to load user statistics")
    }
  }

  // Filter users based on search term and active tab
  const filterUsers = () => {
    let filtered = [...users]

    // Filter by role if not "all"
    if (activeUserTab !== "all") {
      filtered = filtered.filter((user) => user.role === activeUserTab)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.business_name?.toLowerCase().includes(term) ||
          user.phone_number.includes(term) ||
          user.email?.toLowerCase().includes(term),
      )
    }

    setFilteredUsers(filtered)
  }

  // Handle user approval
  const handleApprove = async (userId: string, userName: string) => {
    setConfirmAction({
      type: "approve",
      userId,
      userName,
    })
    setIsConfirmDialogOpen(true)
  }

  // Handle user blocking
  const handleBlock = async (userId: string, userName: string) => {
    setConfirmAction({
      type: "block",
      userId,
      userName,
    })
    setIsConfirmDialogOpen(true)
  }

  // Handle user deletion
  const handleDelete = async (userId: string, userName: string) => {
    setConfirmAction({
      type: "delete",
      userId,
      userName,
    })
    setIsConfirmDialogOpen(true)
  }

  // Execute the confirmed action
  const executeConfirmedAction = async () => {
    if (!confirmAction) return

    setIsLoading(true)
    try {
      const { type, userId } = confirmAction

      if (type === "approve" || type === "block") {
        const { success, error } = await updateUserApprovalStatus(userId, type === "approve")

        if (error) {
          throw error
        }

        if (success) {
          // Update local state
          setUsers(users.map((user) => (user.id === userId ? { ...user, is_approved: type === "approve" } : user)))

          toast({
            title: "Success",
            description: `User ${type === "approve" ? "approved" : "blocked"} successfully.`,
          })

          // Refresh statistics
          loadUserStatistics()
        }
      } else if (type === "delete") {
        // Implement user deletion logic here
        // For now, we'll just show a toast
        toast({
          title: "Not Implemented",
          description: "User deletion is not implemented yet.",
        })
      }
    } catch (error) {
      errorHandler(error, `Failed to ${confirmAction.type} user`)
      toast({
        title: "Error",
        description: `Failed to ${confirmAction.type} user. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsConfirmDialogOpen(false)
      setConfirmAction(null)
    }
  }

  // View user details
  const viewUserDetails = (user: User) => {
    setSelectedUser(user)
    setIsUserDialogOpen(true)
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
    setIsLoading(true)
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

        setIsLoading(false)
      }, 1000)
    } catch (error) {
      errorHandler(error, "Failed to save settings")
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Render user role badge
  const renderRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      retailer: "bg-green-100 text-green-800 border-green-200",
      wholesaler: "bg-blue-100 text-blue-800 border-blue-200",
      delivery: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }

    return (
      <Badge className={`${roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  // Render user status badge
  const renderStatusBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <TranslationProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20 pb-20 px-4">
            <div className="container mx-auto max-w-7xl">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Logout
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.total_users}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Retailers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.retailers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Wholesalers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.wholesalers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.pending_approvals}</div>
                  </CardContent>
                </Card>
              </div>

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

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center w-full md:w-auto">
                          <div className="relative w-full md:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search users..."
                              className="pl-8"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <Select value={activeUserTab} onValueChange={setActiveUserTab}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="retailer">Retailers</SelectItem>
                              <SelectItem value="wholesaler">Wholesalers</SelectItem>
                              <SelectItem value="delivery">Delivery Partners</SelectItem>
                              <SelectItem value="admin">Admins</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button variant="outline" size="icon" onClick={loadUsers}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" className="ml-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Business Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Loading users...
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : filteredUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  No users found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.name || "Unnamed User"}</TableCell>
                                  <TableCell>{renderRoleBadge(user.role)}</TableCell>
                                  <TableCell>{user.phone_number}</TableCell>
                                  <TableCell>{user.business_name || "-"}</TableCell>
                                  <TableCell>{renderStatusBadge(user.is_approved)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      {!user.is_approved ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprove(user.id, user.name || "this user")}
                                          className="bg-green-500 hover:bg-green-600"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleBlock(user.id, user.name || "this user")}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Block
                                        </Button>
                                      )}
                                      <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                          <div className="relative w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search transactions..." className="pl-8" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Transactions</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Transaction ID</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                <p className="text-muted-foreground">Transaction data will appear here.</p>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Disputes Tab */}
                <TabsContent value="disputes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                          <div className="relative w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search disputes..." className="pl-8" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Disputes</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="escalated">Escalated</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Dispute ID</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                <p className="text-muted-foreground">Dispute data will appear here.</p>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tax Tab */}
                <TabsContent value="tax" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Platform Tax Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <Select defaultValue="monthly">
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Report period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button className="bg-blue-500 hover:bg-blue-600">
                          <Download className="mr-2 h-4 w-4" />
                          Export Report
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Period</TableHead>
                              <TableHead>Total Revenue</TableHead>
                              <TableHead>GST Collected</TableHead>
                              <TableHead>GST Paid</TableHead>
                              <TableHead>Net GST</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                <p className="text-muted-foreground">Tax report data will appear here.</p>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
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
                        {isLoading ? (
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </TranslationProvider>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the selected user.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <UserProfile user={selectedUser} size="lg" showRole={true} />

              <div className="grid grid-cols-1 gap-2 pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{selectedUser.phone_number}</span>
                </div>
                {selectedUser.email && (
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                {selectedUser.business_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">Business:</span>
                    <span>{selectedUser.business_name}</span>
                  </div>
                )}
                {selectedUser.pin_code && (
                  <div className="flex justify-between">
                    <span className="font-medium">PIN Code:</span>
                    <span>{selectedUser.pin_code}</span>
                  </div>
                )}
                {selectedUser.gst_number && (
                  <div className="flex justify-between">
                    <span className="font-medium">GST Number:</span>
                    <span>{selectedUser.gst_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span>{selectedUser.is_approved ? "Approved" : "Pending"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Joined:</span>
                  <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              {selectedUser && !selectedUser.is_approved ? (
                <Button
                  onClick={() => {
                    setIsUserDialogOpen(false)
                    handleApprove(selectedUser.id, selectedUser.name || "this user")
                  }}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Approve User
                </Button>
              ) : (
                selectedUser && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsUserDialogOpen(false)
                      handleBlock(selectedUser.id, selectedUser.name || "this user")
                    }}
                  >
                    Block User
                  </Button>
                )
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "approve"
                ? "Approve User"
                : confirmAction?.type === "block"
                  ? "Block User"
                  : "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "approve"
                ? `Are you sure you want to approve ${confirmAction.userName}?`
                : confirmAction?.type === "block"
                  ? `Are you sure you want to block ${confirmAction.userName}?`
                  : `Are you sure you want to delete ${confirmAction?.userName}?`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeConfirmedAction}
              variant={confirmAction?.type === "approve" ? "default" : "destructive"}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : confirmAction?.type === "approve" ? (
                "Approve"
              ) : confirmAction?.type === "block" ? (
                "Block"
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
