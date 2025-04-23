"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { MapPin, Package, Clock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { getAvailableAssignmentsByPinCode, acceptDeliveryAssignment } from "@/lib/delivery-service"
import type { DeliveryAssignment } from "@/lib/delivery-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"

function AssignmentsContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [pinCode, setPinCode] = useState("")
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      setPinCode(user.pinCode || "")
    }
  }, [user])

  const searchAssignments = async () => {
    if (!pinCode) {
      toast({
        title: "Error",
        description: "Please enter a PIN code to search for assignments.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await getAvailableAssignmentsByPinCode(pinCode)
      if (error) {
        throw error
      }
      setAssignments(data || [])
    } catch (error) {
      console.error("Error searching assignments:", error)
      toast({
        title: "Error",
        description: "Failed to search assignments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, this would call an API to get pin code from coordinates
          // For demo, we'll just set a dummy pin code
          setPinCode("400001")
          searchAssignments()
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Error",
            description: "Unable to get your location. Please enter your PIN code manually.",
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser. Please enter your PIN code manually.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptAssignment = async (assignmentId: string) => {
    if (!user) return

    setIsAccepting(true)
    try {
      const { success, error } = await acceptDeliveryAssignment(assignmentId, user.id)
      if (!success) {
        throw error
      }

      toast({
        title: "Success",
        description: "Assignment accepted successfully. You can now start the delivery.",
      })

      // Redirect to active deliveries page
      router.push("/delivery/active")
    } catch (error) {
      console.error("Error accepting assignment:", error)
      toast({
        title: "Error",
        description: "Failed to accept assignment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
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

  const calculateDistance = (pinCode1: string, pinCode2: string) => {
    // In a real app, this would calculate the actual distance between two pin codes
    // For demo, we'll just return a random distance between 1-10 km
    return Math.round((Math.random() * 9 + 1) * 10) / 10
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Assignments</h1>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter PIN code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="pl-10 h-12 text-lg w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={searchAssignments}
                className="h-12 bg-blue-500 hover:bg-blue-600 whitespace-nowrap"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={useCurrentLocation}
                className="h-12 whitespace-nowrap"
                disabled={isLoading}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Use GPS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Searching for assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">No available assignments in this area.</p>
          <p className="text-gray-500 mt-2">Try searching in a different PIN code or check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const retailerPinCode = assignment.order?.retailer?.pin_code || ""
            const wholesalerPinCode = assignment.order?.wholesaler?.pin_code || ""
            const distance = calculateDistance(retailerPinCode, wholesalerPinCode)

            return (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">Order #{assignment.order?.order_number}</h3>
                        <Badge className="bg-blue-500">New</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-500">{formatDate(assignment.created_at)}</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Pickup: {assignment.order?.wholesaler?.business_name || "Wholesaler"}
                            </p>
                            <p className="text-gray-500">PIN: {assignment.order?.wholesaler?.pin_code}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Dropoff: {assignment.order?.retailer?.business_name || "Retailer"}
                            </p>
                            <p className="text-gray-500">PIN: {assignment.order?.retailer?.pin_code}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <p className="text-lg font-semibold">₹{assignment.delivery_charge.toFixed(2)}</p>
                      <p className="text-gray-500">{distance} km</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => handleAcceptAssignment(assignment.id)}
                        disabled={isAccepting}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Toaster />
    </div>
  )
}

export default function AssignmentsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <AssignmentsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
