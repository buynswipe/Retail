"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, User, Truck, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getNearbyDeliveryPartners, assignDeliveryPartner } from "@/lib/delivery-service"
import { getUsersByRole } from "@/lib/user-service"
import { errorHandler } from "@/lib/error-handler"
import type { DeliveryAssignment, User as UserType } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PartnerAssignmentProps {
  deliveryAssignment: DeliveryAssignment
  onAssigned: () => void
}

export function PartnerAssignment({ deliveryAssignment, onAssigned }: PartnerAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [deliveryPartners, setDeliveryPartners] = useState<UserType[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Load delivery partners when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDeliveryPartners()
    }
  }, [isOpen])

  // Load delivery partners
  const loadDeliveryPartners = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First try to get nearby partners based on PIN code
      const pinCode = deliveryAssignment.order?.retailer?.pin_code

      if (pinCode) {
        const { data: nearbyPartners, error: nearbyError } = await getNearbyDeliveryPartners(pinCode)

        if (nearbyError) {
          throw nearbyError
        }

        if (nearbyPartners && nearbyPartners.length > 0) {
          setDeliveryPartners(nearbyPartners)
          setIsLoading(false)
          return
        }
      }

      // If no nearby partners or error, fall back to all delivery partners
      const { data: allPartners, error: allError } = await getUsersByRole("delivery", true)

      if (allError) {
        throw allError
      }

      if (allPartners) {
        setDeliveryPartners(allPartners)
      }
    } catch (error) {
      errorHandler(error, "Failed to load delivery partners")
      setError("Failed to load delivery partners. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Assign delivery partner
  const handleAssignPartner = async () => {
    if (!selectedPartnerId) {
      toast({
        title: "Error",
        description: "Please select a delivery partner",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    setError(null)
    try {
      const { success, error } = await assignDeliveryPartner(deliveryAssignment.id, selectedPartnerId)

      if (error) {
        throw error
      }

      if (success) {
        toast({
          title: "Success",
          description: "Delivery partner assigned successfully",
        })
        setIsOpen(false)
        onAssigned()
      }
    } catch (error) {
      errorHandler(error, "Failed to assign delivery partner")
      setError("Failed to assign delivery partner. Please try again.")
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Assign Partner
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                <p className="text-lg font-semibold">{deliveryAssignment.order?.order_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Delivery Area</h3>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{deliveryAssignment.order?.retailer?.pin_code || "N/A"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Retailer</h3>
              <p className="text-lg font-semibold">{deliveryAssignment.order?.retailer?.business_name}</p>
              <p className="text-sm text-muted-foreground">{deliveryAssignment.order?.retailer?.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Select Delivery Partner</h3>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivery partner" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryPartners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} {partner.vehicle_type ? `(${partner.vehicle_type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Loading delivery partners...</p>
              </div>
            ) : deliveryPartners.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No delivery partners available</AlertTitle>
                <AlertDescription>There are no approved delivery partners available for this area.</AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Available Delivery Partners</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryPartners.map((partner) => (
                        <TableRow
                          key={partner.id}
                          className={selectedPartnerId === partner.id ? "bg-muted" : ""}
                          onClick={() => setSelectedPartnerId(partner.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {partner.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2" />
                              {partner.vehicle_type || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {partner.pin_code || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Available
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPartner} disabled={isAssigning || !selectedPartnerId}>
              {isAssigning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
