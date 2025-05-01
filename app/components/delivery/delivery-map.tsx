"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Truck, Package } from "lucide-react"
import { getDeliveryAssignments } from "@/lib/delivery-service"
import { errorHandler } from "@/lib/error-handler"
import { useToast } from "@/hooks/use-toast"
import type { DeliveryAssignment } from "@/lib/types"

interface DeliveryMapProps {
  pinCode?: string
}

export function DeliveryMap({ pinCode }: DeliveryMapProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryAssignment[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Load deliveries on component mount
  useEffect(() => {
    loadDeliveries()
  }, [])

  // Filter deliveries when status filter changes
  useEffect(() => {
    filterDeliveries()
  }, [statusFilter, deliveries])

  // Load deliveries
  const loadDeliveries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await getDeliveryAssignments()

      if (error) {
        throw error
      }

      if (data) {
        // If pinCode is provided, filter deliveries by that PIN code
        const filteredData = pinCode
          ? data.filter((d) => d.order?.retailer?.pin_code === pinCode || d.order?.wholesaler?.pin_code === pinCode)
          : data

        setDeliveries(filteredData)
      }
    } catch (error) {
      errorHandler(error, "Failed to load deliveries")
      setError("Failed to load deliveries. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load deliveries for the map view.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter deliveries based on status
  const filterDeliveries = () => {
    if (statusFilter === "all") {
      setFilteredDeliveries(deliveries)
    } else {
      setFilteredDeliveries(deliveries.filter((d) => d.status === statusFilter))
    }
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Delivery Map</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deliveries</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadDeliveries}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading delivery map...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-[400px] text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative h-[400px] bg-gray-100 rounded-md overflow-hidden">
            {/* Map Placeholder - In a real implementation, this would be an actual map */}
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">Map View (Placeholder)</p>
            </div>

            {/* Delivery Markers */}
            {filteredDeliveries.map((delivery) => {
              // In a real implementation, you would position these based on geocoded coordinates
              // For now, we'll just place them randomly
              const left = Math.floor(Math.random() * 80) + 10 + "%"
              const top = Math.floor(Math.random() * 80) + 10 + "%"

              return (
                <div
                  key={delivery.id}
                  className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                >
                  <div className="relative group">
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${
                        delivery.status === "pending"
                          ? "bg-yellow-500"
                          : delivery.status === "accepted"
                            ? "bg-blue-500"
                            : delivery.status === "completed"
                              ? "bg-green-500"
                              : "bg-red-500"
                      }
                      text-white cursor-pointer
                    `}
                    >
                      {delivery.status === "pending" ? (
                        <Package className="h-4 w-4" />
                      ) : delivery.status === "accepted" ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white rounded-md shadow-lg p-2 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                      <div className="font-medium">{delivery.order?.order_number}</div>
                      <div className="text-gray-600">{delivery.order?.retailer?.business_name}</div>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{delivery.order?.retailer?.pin_code}</span>
                      </div>
                      <div className="mt-1">{renderStatusBadge(delivery.status)}</div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredDeliveries.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">No deliveries found for the selected filter.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">In Transit</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Declined</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
