"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Truck, MapPin, Package, Clock, CheckCircle, X, Camera, FileText, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

function DeliveryDashboardContent() {
  const { t } = useTranslation()
  const [assignments, setAssignments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("assignments")
  const router = useRouter()

  useEffect(() => {
    // Mock data
    const mockAssignments = [
      {
        id: "DEL001",
        orderId: "ORD005",
        date: "2023-04-22",
        status: "pending",
        pickup: {
          name: "Vikram Wholesale",
          address: "123 Main St, Mumbai",
          pinCode: "400001",
        },
        dropoff: {
          name: "Raj Grocery Store",
          address: "456 Market St, Mumbai",
          pinCode: "400001",
        },
        distance: 3.2,
        amount: 50,
      },
      {
        id: "DEL002",
        orderId: "ORD006",
        date: "2023-04-22",
        status: "accepted",
        pickup: {
          name: "Patel Supplies",
          address: "789 Lake Rd, Mumbai",
          pinCode: "400002",
        },
        dropoff: {
          name: "Ajay General Store",
          address: "101 Hill St, Mumbai",
          pinCode: "400002",
        },
        distance: 2.7,
        amount: 50,
      },
    ]

    setAssignments(mockAssignments)
  }, [])

  const handleAccept = (id: string) => {
    // In a real app, this would update the assignment in Supabase
    setAssignments(
      assignments.map((assignment) => (assignment.id === id ? { ...assignment, status: "accepted" } : assignment)),
    )
  }

  const handleDecline = (id: string) => {
    // In a real app, this would update the assignment in Supabase
    setAssignments(assignments.filter((assignment) => assignment.id !== id))
  }

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Delivery Partner Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
                <h3 className="text-3xl font-bold">{assignments.filter((a) => a.status === "pending").length}</h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
                <h3 className="text-3xl font-bold">
                  ₹{assignments.filter((a) => a.status === "accepted").reduce((acc, curr) => acc + curr.amount, 0)}
                </h3>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Distance</p>
                <h3 className="text-3xl font-bold">
                  {assignments
                    .filter((a) => a.status === "accepted")
                    .reduce((acc, curr) => acc + curr.distance, 0)
                    .toFixed(1)}{" "}
                  km
                </h3>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="assignments" className="text-lg py-3">
            <Package className="mr-2 h-5 w-5" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="active" className="text-lg py-3">
            <Truck className="mr-2 h-5 w-5" />
            Active Deliveries
          </TabsTrigger>
          <TabsTrigger value="history" className="text-lg py-3">
            <FileText className="mr-2 h-5 w-5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.filter((a) => a.status === "pending").length > 0 ? (
                <div className="space-y-4">
                  {assignments
                    .filter((a) => a.status === "pending")
                    .map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-semibold">Order #{assignment.orderId}</h3>
                                <Badge className="bg-blue-500">New</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">{assignment.date}</span>
                              </div>

                              <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Pickup: {assignment.pickup.name}</p>
                                    <p className="text-gray-500">{assignment.pickup.address}</p>
                                    <p className="text-gray-500">PIN: {assignment.pickup.pinCode}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Dropoff: {assignment.dropoff.name}</p>
                                    <p className="text-gray-500">{assignment.dropoff.address}</p>
                                    <p className="text-gray-500">PIN: {assignment.dropoff.pinCode}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-center md:text-right">
                              <p className="text-lg font-semibold">₹{assignment.amount}</p>
                              <p className="text-gray-500">{assignment.distance} km</p>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                              <Button
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => handleAccept(assignment.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-500 border-red-500 hover:bg-red-50"
                                onClick={() => handleDecline(assignment.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No pending assignments at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.filter((a) => a.status === "accepted").length > 0 ? (
                <div className="space-y-4">
                  {assignments
                    .filter((a) => a.status === "accepted")
                    .map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-500" />
                                <h3 className="text-lg font-semibold">Order #{assignment.orderId}</h3>
                                <Badge className="bg-orange-500">In Progress</Badge>
                              </div>

                              <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Pickup: {assignment.pickup.name}</p>
                                    <p className="text-gray-500">{assignment.pickup.address}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Dropoff: {assignment.dropoff.name}</p>
                                    <p className="text-gray-500">{assignment.dropoff.address}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                              <Button className="bg-orange-500 hover:bg-orange-600">
                                <Camera className="mr-2 h-4 w-4" />
                                Mark Delivered
                              </Button>
                              <Button variant="outline">Get Directions</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No active deliveries at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Delivery History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Tax Report
                </Button>
              </div>
              <div className="p-8 text-center text-gray-500">
                <p>Your delivery history will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DeliveryDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <DeliveryDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
