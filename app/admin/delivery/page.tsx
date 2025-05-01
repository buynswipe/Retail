"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, RefreshCw, Download, MapPin, Truck, Eye, Calendar } from "lucide-react"
import { getDeliveryAssignments, getDeliveryStatistics } from "@/lib/delivery-service"
import { getUsersByRole } from "@/lib/user-service"
import type { DeliveryAssignment, User } from "@/lib/types"
import ProtectedRoute from "@/app/components/protected-route"
import Navbar from "@/app/components/navbar"
import { errorHandler } from "@/lib/error-handler"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PartnerAssignment } from "@/app/components/delivery/partner-assignment"
import { DeliveryTracking } from "@/app/components/delivery/delivery-tracking"
import { DeliveryMap } from "@/app/components/delivery/delivery-map"
import { DeliveryAnalytics } from "@/app/components/analytics/delivery-analytics"

export default function AdminDeliveryPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [activeView, setActiveView] = useState("list")
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryAssignment[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAssignment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [areaFilter, setAreaFilter] = useState<string>("all")
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const [areas, setAreas] = useState<string[]>([])
  const [statistics, setStatistics] = useState<any>({
    total_deliveries: 0,
    pending_deliveries: 0,
    active_deliveries: 0,
    completed_deliveries: 0,
    completed_today: 0,
    average_delivery_time: 0,
  })

  const { toast } = useToast()

  // Load deliveries and delivery partners on component mount
  useEffect(() => {
    loadDeliveries()
    loadDeliveryPartners()
    loadStatistics()
  }, [])

  // Filter deliveries when search term or active tab changes
  useEffect(() => {
    filterDeliveries()
  }, [searchTerm, activeTab, deliveries, dateFilter, areaFilter, partnerFilter])

  // Load deliveries from the database
  const loadDeliveries = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getDeliveryAssignments()

      if (error) {
        throw error
      }

      if (data) {
        setDeliveries(data)

        // Extract unique areas from delivery data
        const uniqueAreas = Array.from(new Set(data.map((d) => d.order?.retailer?.pin_code).filter(Boolean)))
        setAreas(uniqueAreas as string[])
      }
    } catch (error) {
      errorHandler(error, "Failed to load deliveries")
      toast({
        title: "Error",
        description: "Failed to load deliveries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load delivery statistics
  const loadStatistics = async () => {
    try {
      const { data, error } = await getDeliveryStatistics()

      if (error) {
        throw error
      }

      if (data) {
        setStatistics(data)
      }
    } catch (error) {
      errorHandler(error, "Failed to load delivery statistics")
    }
  }

  // Load delivery partners
  const loadDeliveryPartners = async () => {
    try {
      const { data, error } = await getUsersByRole("delivery", true)

      if (error) {
        throw error
      }

      if (data) {
        setDeliveryPartners(data)
      }
    } catch (error) {
      errorHandler(error, "Failed to load delivery partners")
    }
  }

  // Filter deliveries based on search term, active tab, and filters
  const filterDeliveries = () => {
    let filtered = [...deliveries]

    // Filter by status
    if (activeTab === "pending") {
      filtered = filtered.filter((d) => d.status === "pending")
    } else if (activeTab === "active") {
      filtered = filtered.filter((d) => d.status === "accepted")
    } else if (activeTab === "completed") {
      filtered = filtered.filter((d) => d.status === "completed")
    } else if (activeTab === "declined") {
      filtered = filtered.filter((d) => d.status === "declined")
    }

    // Filter by date
    if (dateFilter === "today") {
      const today = new Date().toDateString()
      filtered = filtered.filter((d) => new Date(d.created_at).toDateString() === today)
    } else if (dateFilter === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter((d) => new Date(d.created_at) >= weekAgo)
    } else if (dateFilter === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter((d) => new Date(d.created_at) >= monthAgo)
    }

    // Filter by area (PIN code)
    if (areaFilter !== "all") {
      filtered = filtered.filter((d) => d.order?.retailer?.pin_code === areaFilter)
    }

    // Filter by delivery partner
    if (partnerFilter !== "all") {
      filtered = filtered.filter((d) => d.delivery_partner_id === partnerFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.order?.order_number.toLowerCase().includes(term) ||
          d.order?.retailer?.name?.toLowerCase().includes(term) ||
          d.order?.retailer?.business_name?.toLowerCase().includes(term) ||
          d.delivery_partner?.name?.toLowerCase().includes(term),
      )
    }

    setFilteredDeliveries(filtered)
  }

  // View delivery details
  const viewDeliveryDetails = (delivery: DeliveryAssignment) => {
    setSelectedDelivery(delivery)
    setIsDetailsOpen(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      declined: "bg-red-100 text-red-800 border-red-200",
    }

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Handle refresh
  const handleRefresh = () => {
    loadDeliveries()
    loadStatistics()
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Delivery Management</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Select value={activeView} onValueChange={setActiveView}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="map">Map View</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.pending_deliveries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.active_deliveries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.completed_today}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.average_delivery_time} hrs</div>
                </CardContent>
              </Card>
            </div>

            {activeView === "list" && (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-8">
                    <TabsTrigger value="pending" className="text-lg py-3">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="active" className="text-lg py-3">
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-lg py-3">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="declined" className="text-lg py-3">
                      Declined
                    </TabsTrigger>
                  </TabsList>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Delivery Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center w-full md:w-auto">
                          <div className="relative w-full md:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search deliveries..."
                              className="pl-8"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Date filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={areaFilter} onValueChange={setAreaFilter}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Area filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Areas</SelectItem>
                              {areas.map((area) => (
                                <SelectItem key={area} value={area}>
                                  PIN: {area}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Partner filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Partners</SelectItem>
                              {deliveryPartners.map((partner) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

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
                              <TableHead>Order #</TableHead>
                              <TableHead>Retailer</TableHead>
                              <TableHead>Area</TableHead>
                              <TableHead>Delivery Partner</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Loading deliveries...
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : filteredDeliveries.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                  No deliveries found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredDeliveries.map((delivery) => (
                                <TableRow key={delivery.id}>
                                  <TableCell className="font-medium">{delivery.order?.order_number}</TableCell>
                                  <TableCell>{delivery.order?.retailer?.business_name || "Unknown"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {delivery.order?.retailer?.pin_code || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {delivery.delivery_partner ? (
                                      <div className="flex items-center">
                                        <Truck className="h-4 w-4 mr-1" />
                                        {delivery.delivery_partner.name}
                                      </div>
                                    ) : (
                                      "Unassigned"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {formatDate(delivery.created_at)}
                                    </div>
                                  </TableCell>
                                  <TableCell>{renderStatusBadge(delivery.status)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      {delivery.status === "pending" && !delivery.delivery_partner_id && (
                                        <PartnerAssignment deliveryAssignment={delivery} onAssigned={handleRefresh} />
                                      )}
                                      <DeliveryTracking deliveryAssignment={delivery} />
                                      <Button size="sm" variant="outline" onClick={() => viewDeliveryDetails(delivery)}>
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
                </Tabs>
              </>
            )}

            {activeView === "map" && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl">Delivery Map View</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryMap />
                </CardContent>
              </Card>
            )}

            {activeView === "analytics" && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl">Delivery Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryAnalytics />
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Delivery Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
            </DialogHeader>

            {selectedDelivery && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                    <p className="text-lg font-semibold">{selectedDelivery.order?.order_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">{renderStatusBadge(selectedDelivery.status)}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Retailer</h3>
                  <p className="text-lg font-semibold">{selectedDelivery.order?.retailer?.business_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.order?.retailer?.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Delivery Address</h3>
                  <p className="text-base">PIN Code: {selectedDelivery.order?.retailer?.pin_code}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Delivery Partner</h3>
                  {selectedDelivery.delivery_partner ? (
                    <>
                      <p className="text-lg font-semibold">{selectedDelivery.delivery_partner.name}</p>
                      <p className="text-sm">{selectedDelivery.delivery_partner.phone_number}</p>
                      {selectedDelivery.delivery_partner.vehicle_type && (
                        <p className="text-sm text-muted-foreground">
                          Vehicle: {selectedDelivery.delivery_partner.vehicle_type.toUpperCase()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-base">Not assigned yet</p>
                      <PartnerAssignment
                        deliveryAssignment={selectedDelivery}
                        onAssigned={() => {
                          handleRefresh()
                          setIsDetailsOpen(false)
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Delivery Charges</h3>
                  <p className="text-lg font-semibold">
                    ₹{selectedDelivery.delivery_charge.toFixed(2)}
                    <span className="text-sm text-muted-foreground ml-2">
                      (GST: ₹{selectedDelivery.delivery_charge_gst.toFixed(2)})
                    </span>
                  </p>
                </div>

                {selectedDelivery.status === "completed" && selectedDelivery.proof_image_url && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Delivery Proof</h3>
                    <div className="mt-2">
                      <img
                        src={selectedDelivery.proof_image_url || "/placeholder.svg"}
                        alt="Delivery Proof"
                        className="rounded-md max-h-40 object-cover"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Created</span>
                      <span className="text-sm font-medium">{formatDate(selectedDelivery.created_at)}</span>
                    </div>
                    {selectedDelivery.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-sm">Last Updated</span>
                        <span className="text-sm font-medium">{formatDate(selectedDelivery.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
