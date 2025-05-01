"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, CheckCircle, Clock, MapPin, User, Phone, Calendar, AlertCircle } from "lucide-react"
import type { DeliveryAssignment } from "@/lib/types"

interface DeliveryTrackingProps {
  deliveryAssignment: DeliveryAssignment
}

export function DeliveryTracking({ deliveryAssignment }: DeliveryTrackingProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get status step
  const getStatusStep = () => {
    switch (deliveryAssignment.status) {
      case "pending":
        return 0
      case "accepted":
        return 1
      case "completed":
        return 2
      case "declined":
        return -1
      default:
        return 0
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
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Track Delivery
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delivery Tracking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order and Status Info */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                <p className="text-lg font-semibold">{deliveryAssignment.order?.order_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="mt-1">{renderStatusBadge(deliveryAssignment.status)}</div>
              </div>
            </div>

            {/* Tracking Steps */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Step 1: Order Created */}
              <div className="flex mb-8 relative">
                <div
                  className={`z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    getStatusStep() >= 0 ? "bg-primary text-primary-foreground" : "bg-gray-200"
                  }`}
                >
                  <Package className="w-4 h-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Order Created</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(deliveryAssignment.created_at)}</p>
                  <p className="text-sm mt-1">Delivery assignment created and waiting for a delivery partner.</p>
                </div>
              </div>

              {/* Step 2: In Transit */}
              <div className="flex mb-8 relative">
                <div
                  className={`z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    getStatusStep() >= 1 ? "bg-primary text-primary-foreground" : "bg-gray-200"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">In Transit</h3>
                  {deliveryAssignment.status === "accepted" || deliveryAssignment.status === "completed" ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {deliveryAssignment.updated_at ? formatDate(deliveryAssignment.updated_at) : "N/A"}
                      </p>
                      <p className="text-sm mt-1">Delivery partner has accepted the assignment and is en route.</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Waiting for delivery partner to accept</p>
                  )}
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div className="flex relative">
                <div
                  className={`z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    getStatusStep() >= 2 ? "bg-primary text-primary-foreground" : "bg-gray-200"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Delivered</h3>
                  {deliveryAssignment.status === "completed" ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {deliveryAssignment.updated_at ? formatDate(deliveryAssignment.updated_at) : "N/A"}
                      </p>
                      <p className="text-sm mt-1">Order successfully delivered to the retailer.</p>

                      {deliveryAssignment.proof_image_url && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Delivery Proof:</p>
                          <img
                            src={deliveryAssignment.proof_image_url || "/placeholder.svg"}
                            alt="Delivery Proof"
                            className="mt-1 rounded-md max-h-32 object-cover"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Waiting for delivery confirmation</p>
                  )}
                </div>
              </div>

              {/* Declined Status (if applicable) */}
              {deliveryAssignment.status === "declined" && (
                <div className="mt-8 p-4 border border-red-200 rounded-md bg-red-50">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800">Delivery Declined</h3>
                      <p className="text-sm text-red-700 mt-1">
                        The delivery partner has declined this assignment. Please assign a new delivery partner.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {/* Retailer Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Retailer</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <User className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{deliveryAssignment.order?.retailer?.business_name}</p>
                      <p className="text-sm">{deliveryAssignment.order?.retailer?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                    <p className="text-sm">PIN: {deliveryAssignment.order?.retailer?.pin_code || "N/A"}</p>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                    <p className="text-sm">{deliveryAssignment.order?.retailer?.phone_number || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Partner Info */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Delivery Partner</h3>
                {deliveryAssignment.delivery_partner ? (
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <User className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                      <p className="font-medium">{deliveryAssignment.delivery_partner.name}</p>
                    </div>

                    <div className="flex items-start">
                      <Phone className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                      <p className="text-sm">{deliveryAssignment.delivery_partner.phone_number || "N/A"}</p>
                    </div>

                    <div className="flex items-start">
                      <Truck className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                      <p className="text-sm">
                        {deliveryAssignment.delivery_partner.vehicle_type
                          ? `${deliveryAssignment.delivery_partner.vehicle_type.toUpperCase()}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No delivery partner assigned yet</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Timeline</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>Created</span>
                  </div>
                  <span>{formatDate(deliveryAssignment.created_at)}</span>
                </div>

                {deliveryAssignment.updated_at && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Last Updated</span>
                    </div>
                    <span>{formatDate(deliveryAssignment.updated_at)}</span>
                  </div>
                )}

                {deliveryAssignment.status === "completed" && deliveryAssignment.updated_at && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <span>Completed</span>
                    </div>
                    <span>{formatDate(deliveryAssignment.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
