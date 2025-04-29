"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Truck, MapPin, Clock, ArrowLeft, Camera, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { getAssignmentsByDeliveryPartner } from "@/lib/delivery-service"
import { markCodPaymentCollected } from "@/lib/payment-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

function ActiveDeliveriesContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      loadActiveDeliveries()
    }
  }, [user])

  const loadActiveDeliveries = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // FIX: Use demo data if user ID doesn't look like a UUID
      if (user.id.startsWith("user-")) {
        // Use demo data for preview/development
        setActiveDeliveries([
          {
            id: "demo-delivery-1",
            status: "accepted",
            created_at: new Date().toISOString(),
            otp: "123456",
            order: {
              id: "demo-order-1",
              order_number: "ORD12345",
              total_amount: 1250.0,
              payment_method: "cod",
              wholesaler: {
                business_name: "Demo Wholesaler",
                name: "Demo Wholesaler",
                pin_code: "400001",
                phone_number: "9876543210",
              },
              retailer: {
                business_name: "Demo Retailer",
                name: "Demo Retailer",
                pin_code: "400002",
                phone_number: "9876543211",
              },
            },
          },
        ])
      } else {
        // Use real data for production
        const { data, error } = await getAssignmentsByDeliveryPartner(user.id)
        if (error) {
          console.error("Error loading deliveries:", error)
        } else if (data) {
          // Filter for active deliveries
          const active = data.filter((delivery) => delivery.status === "accepted")
          setActiveDeliveries(active)
        }
      }
    } catch (error) {
      console.error("Error loading deliveries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleCollectPayment = (delivery: any) => {
    setSelectedDelivery(delivery)
    setShowPaymentDialog(true)
  }

  const confirmPaymentCollection = async () => {
    if (!selectedDelivery || !selectedDelivery.order) return

    setIsProcessing(true)
    try {
      // Get payment ID from order
      const orderId = selectedDelivery.order.id

      // In a real app, you would fetch the payment ID from the order
      // For now, we'll use a mock payment ID
      const paymentId = "mock-payment-id"

      const { success, error } = await markCodPaymentCollected(paymentId, user!.id)

      if (!success) {
        throw error
      }

      toast({
        title: "Success",
        description: "Payment marked as collected successfully.",
      })

      setShowPaymentDialog(false)
      loadActiveDeliveries() // Refresh the list
    } catch (error) {
      console.error("Error marking payment as collected:", error)
      toast({
        title: "Error",
        description: "Failed to mark payment as collected. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Active Deliveries</h1>
        <Button asChild variant="outline">
          <Link href="/delivery/dashboard">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Active Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Loading active deliveries...</p>
            </div>
          ) : activeDeliveries.length > 0 ? (
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-orange-500" />
                          <h3 className="text-lg font-semibold">Order #{delivery.order.order_number}</h3>
                          <Badge className="bg-orange-500">In Progress</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500">{formatDate(delivery.created_at)}</span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium">
                                Pickup: {delivery.order.wholesaler.business_name || delivery.order.wholesaler.name}
                              </p>
                              <p className="text-gray-500">PIN: {delivery.order.wholesaler.pin_code}</p>
                              <p className="text-gray-500">Phone: {delivery.order.wholesaler.phone_number}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium">
                                Dropoff: {delivery.order.retailer.business_name || delivery.order.retailer.name}
                              </p>
                              <p className="text-gray-500">PIN: {delivery.order.retailer.pin_code}</p>
                              <p className="text-gray-500">Phone: {delivery.order.retailer.phone_number}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium">Verification OTP: {delivery.otp}</p>
                          <p className="text-xs text-gray-500">Share this OTP with the retailer to verify delivery</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button className="bg-blue-500 hover:bg-blue-600">
                          <Camera className="mr-2 h-4 w-4" />
                          Mark Delivered
                        </Button>
                        <Button variant="outline">Get Directions</Button>
                        {delivery.order.payment_method === "cod" && (
                          <Button
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-50"
                            onClick={() => handleCollectPayment(delivery)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Collect Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No active deliveries at the moment.</p>
              <Button asChild className="mt-4 bg-blue-500 hover:bg-blue-600">
                <Link href="/delivery/assignments">Find Assignments</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Collection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Cash on Delivery</DialogTitle>
            <DialogDescription>Confirm that you have collected the payment from the retailer.</DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Order Details</p>
                <p className="text-sm text-gray-500">Order #{selectedDelivery.order.order_number}</p>
                <p className="text-sm text-gray-500">Amount: ₹{selectedDelivery.order.total_amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">
                  Retailer: {selectedDelivery.order.retailer.business_name || selectedDelivery.order.retailer.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-collected">Amount Collected</Label>
                <Input
                  id="amount-collected"
                  value={selectedDelivery.order.total_amount.toFixed(2)}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmPaymentCollection}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600"
            >
              {isProcessing ? "Processing..." : "Confirm Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function ActiveDeliveriesPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <ActiveDeliveriesContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
