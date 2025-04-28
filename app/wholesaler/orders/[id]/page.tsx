"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { EnhancedOrderTracking } from "@/app/components/orders/enhanced-order-tracking"
import { OrderSummary } from "@/app/components/orders/order-summary"
import { OrderItems } from "@/app/components/orders/order-items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getOrderById, generateOrderInvoice } from "@/lib/order-service"
import { formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Printer,
  Share2,
  AlertTriangle,
  Loader2,
  User,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function WholesalerOrderDetailsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await getOrderById(orderId)
        if (error) throw error

        // Check if the user has permission to view this order
        if (data.wholesaler_id !== user.id) {
          throw new Error("You don't have permission to view this order")
        }

        setOrder(data)
      } catch (error) {
        console.error("Failed to load order:", error)
        setError(error instanceof Error ? error.message : "Failed to load order details")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadOrder()
    }
  }, [orderId, user])

  const handleOrderStatusUpdate = async () => {
    if (!user) return

    try {
      const { data, error } = await getOrderById(orderId)
      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Failed to refresh order:", error)
      toast({
        title: "Error",
        description: "Failed to refresh order details",
        variant: "destructive",
      })
    }
  }

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true)
    try {
      const { data, error } = await generateOrderInvoice(orderId)
      if (error) throw error

      // In a real application, you would download the PDF here
      // For now, we'll just show a success message
      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated successfully.",
      })

      console.log("Invoice data:", data)
    } catch (error) {
      console.error("Failed to generate invoice:", error)
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || "Failed to load order details"}</AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/wholesaler/orders">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Back to Orders")}
              </Link>
            </Button>
          </div>
        </main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <Button variant="outline" asChild className="mb-2">
                <Link href="/wholesaler/orders">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("Back to Orders")}
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">
                {t("Order")} #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-gray-500">
                {t("Placed on")} {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Printer className="mr-2 h-4 w-4" />
                {t("Print")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateInvoice} disabled={isGeneratingInvoice}>
                {isGeneratingInvoice ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("Generate Invoice")}
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Share2 className="mr-2 h-4 w-4" />
                {t("Share")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Tracking */}
            <div className="md:col-span-2 space-y-6">
              <EnhancedOrderTracking order={order} onStatusUpdate={handleOrderStatusUpdate} />

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {t("Order Items")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderItems items={order.items} />
                </CardContent>
              </Card>

              {/* Retailer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    {t("Retailer Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {order.retailer?.profile_image ? (
                        <Image
                          src={order.retailer.profile_image || "/placeholder.svg"}
                          alt={order.retailer.business_name || order.retailer.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{order.retailer?.business_name || order.retailer?.name}</h3>
                      <div className="text-sm text-gray-500 space-y-1 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {order.retailer?.address}, {order.retailer?.city}, {order.retailer?.state}{" "}
                            {order.retailer?.pincode}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>{order.retailer?.phone}</span>
                        </div>
                        {order.retailer?.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            <span>{order.retailer?.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    {t("Delivery Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">{t("Delivery Address")}</p>
                        <p className="font-medium">{order.delivery_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">{t("Contact")}</p>
                        <p className="font-medium">{order.delivery_contact}</p>
                      </div>
                    </div>
                    {order.notes && (
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">{t("Notes")}</p>
                          <p className="font-medium">{order.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {t("Order Summary")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderSummary order={order} />

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t("Payment Method")}</span>
                      <span className="font-medium">
                        {order.payment_status === "cod" ? t("Cash on Delivery") : t("Online Payment")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">{t("Payment Status")}</span>
                      <Badge
                        variant="outline"
                        className={
                          order.payment_status === "paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : order.payment_status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {order.payment_status === "paid"
                          ? t("Paid")
                          : order.payment_status === "pending"
                            ? t("Pending")
                            : t("Failed")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Quick Actions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" asChild>
                      <Link href={`/chat?orderId=${order.id}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        {t("Message Retailer")}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/wholesaler/inventory`}>
                        <Store className="mr-2 h-4 w-4" />
                        {t("Check Inventory")}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
