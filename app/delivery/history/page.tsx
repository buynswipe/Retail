"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Package, Clock, FileText, Search, X, Calendar, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { getAssignmentsByDeliveryPartner } from "@/lib/delivery-service"
import type { DeliveryAssignment } from "@/lib/delivery-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function HistoryContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<DeliveryAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadAssignments()
    }
  }, [user])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchQuery, statusFilter, dateFilter])

  const loadAssignments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // FIX: Use demo data if user ID doesn't look like a UUID
      if (user.id.startsWith("user-")) {
        // Use demo data for preview/development
        const demoAssignments = [
          {
            id: "demo-assignment-1",
            order_id: "demo-order-1",
            delivery_partner_id: user.id,
            status: "completed",
            delivery_charge: 50,
            delivery_charge_gst: 9,
            created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updated_at: new Date(Date.now() - 82800000).toISOString(),
            otp: "123456",
            proof_image_url: "/digital-signature-confirmation.png",
            order: {
              order_number: "ORD12345",
              retailer: {
                business_name: "Demo Retailer Shop",
                pin_code: "400001",
              },
              wholesaler: {
                business_name: "Demo Wholesaler Ltd",
                pin_code: "400002",
              },
            },
          },
          {
            id: "demo-assignment-2",
            order_id: "demo-order-2",
            delivery_partner_id: user.id,
            status: "completed",
            delivery_charge: 75,
            delivery_charge_gst: 13.5,
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updated_at: new Date(Date.now() - 169200000).toISOString(),
            otp: "654321",
            proof_image_url: "/digital-delivery-check.png",
            order: {
              order_number: "ORD12346",
              retailer: {
                business_name: "Another Retail Store",
                pin_code: "400003",
              },
              wholesaler: {
                business_name: "Premium Wholesaler",
                pin_code: "400004",
              },
            },
          },
          {
            id: "demo-assignment-3",
            order_id: "demo-order-3",
            delivery_partner_id: user.id,
            status: "declined",
            delivery_charge: 60,
            delivery_charge_gst: 10.8,
            created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            updated_at: new Date(Date.now() - 259200000).toISOString(),
            otp: null,
            proof_image_url: null,
            order: {
              order_number: "ORD12347",
              retailer: {
                business_name: "Local Kirana Store",
                pin_code: "400005",
              },
              wholesaler: {
                business_name: "City Distributors",
                pin_code: "400006",
              },
            },
          },
        ]

        setAssignments(demoAssignments)
      } else {
        // Use real data for production
        const { data, error } = await getAssignmentsByDeliveryPartner(user.id)
        if (error) {
          throw error
        }
        setAssignments(data || [])
      }
    } catch (error) {
      console.error("Error loading assignments:", error)
      toast({
        title: "Error",
        description: "Failed to load delivery history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAssignments = () => {
    let filtered = [...assignments]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const lastMonth = new Date(today)
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      filtered = filtered.filter((assignment) => {
        const assignmentDate = new Date(assignment.created_at)
        switch (dateFilter) {
          case "today":
            return assignmentDate >= today
          case "yesterday":
            return assignmentDate >= yesterday && assignmentDate < today
          case "week":
            return assignmentDate >= lastWeek
          case "month":
            return assignmentDate >= lastMonth
          default:
            return true
        }
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.order?.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.order?.retailer?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.order?.wholesaler?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredAssignments(filtered)
  }

  const handleViewDetails = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment)
    setIsDialogOpen(true)
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500"
      case "accepted":
        return "bg-orange-500"
      case "completed":
        return "bg-green-500"
      case "declined":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const calculateEarnings = () => {
    return filteredAssignments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + a.delivery_charge, 0)
      .toFixed(2)
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Delivery History</h1>
        <Button variant="outline" className="whitespace-nowrap">
          <FileText className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
                <h3 className="text-3xl font-bold">
                  {filteredAssignments.filter((a) => a.status === "completed").length}
                </h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <h3 className="text-3xl font-bold">₹{calculateEarnings()}</h3>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <h3 className="text-3xl font-bold">
                  {assignments.length
                    ? Math.round(
                        (assignments.filter((a) => a.status === "completed").length / assignments.length) * 100,
                      )
                    : 0}
                  %
                </h3>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by order number or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 min-w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="accepted">In Progress</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-12 min-w-[150px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Loading delivery history...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">
            {searchQuery || statusFilter !== "all" || dateFilter !== "all"
              ? "No deliveries match your search criteria"
              : "You haven't completed any deliveries yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">Order #{assignment.order?.order_number}</h3>
                      <Badge className={getStatusBadgeColor(assignment.status)}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">{formatDate(assignment.created_at)}</span>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium">From: {assignment.order?.wholesaler?.business_name || "Wholesaler"}</p>
                      <p className="font-medium">To: {assignment.order?.retailer?.business_name || "Retailer"}</p>
                    </div>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-lg font-semibold">₹{assignment.delivery_charge.toFixed(2)}</p>
                    {assignment.status === "completed" && assignment.proof_image_url && (
                      <p className="text-green-500 text-sm">Proof Uploaded</p>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => handleViewDetails(assignment)}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              Order #{selectedAssignment?.order?.order_number} - {formatDate(selectedAssignment?.created_at || "")}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Status</h3>
                <Badge className={getStatusBadgeColor(selectedAssignment.status)}>
                  {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Pickup</h3>
                <p>{selectedAssignment.order?.wholesaler?.business_name}</p>
                <p className="text-sm text-gray-500">PIN: {selectedAssignment.order?.wholesaler?.pin_code}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Dropoff</h3>
                <p>{selectedAssignment.order?.retailer?.business_name}</p>
                <p className="text-sm text-gray-500">PIN: {selectedAssignment.order?.retailer?.pin_code}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Earnings</h3>
                <p className="text-lg font-bold">₹{selectedAssignment.delivery_charge.toFixed(2)}</p>
              </div>

              {selectedAssignment.status === "completed" && selectedAssignment.proof_image_url && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Delivery Proof</h3>
                  <div className="w-full h-48 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={selectedAssignment.proof_image_url || "/placeholder.svg"}
                      alt="Delivery Proof"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function HistoryPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <HistoryContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
