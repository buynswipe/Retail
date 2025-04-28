"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatCurrency } from "@/lib/utils"
import { createOrder } from "@/lib/order-service"
import { getWholesalerById } from "@/lib/user-service"
import { ShoppingCart, CreditCard, Truck, ArrowLeft, Package, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function CheckoutContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { items, total, clearCart, wholesalerId } = useCart()
  const router = useRouter()

  const [wholesaler, setWholesaler] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(50) // Default delivery fee
  const [paymentMethod, setPaymentMethod] = useState("cod")

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    notes: "",
  })

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push("/retailer/browse")
      return
    }

    // Load wholesaler details
    const loadWholesaler = async () => {
      if (!wholesalerId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await getWholesalerById(wholesalerId)
        if (error) throw error
        setWholesaler(data)

        // Calculate delivery fee based on distance (simplified)
        if (data && user) {
          if (data.city === user.city) {
            setDeliveryFee(50) // Same city
          } else if (data.state === user.state) {
            setDeliveryFee(100) // Same state
          } else {
            setDeliveryFee(200) // Different state
          }
        }
      } catch (error) {
        console.error("Failed to load wholesaler:", error)
        toast({
          title: "Error",
          description: "Failed to load wholesaler details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWholesaler()
  }, [wholesalerId, user, router, items.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !wholesalerId) return

    // Validate form
    const requiredFields = ["name", "phone", "address", "city", "state", "pincode"]
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare order items
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))

      // Create order
      const { data, error } = await createOrder({
        retailer_id: user.id,
        wholesaler_id: wholesalerId,
        total_amount: total + deliveryFee,
        payment_status: paymentMethod === "cod" ? "pending" : "paid",
        delivery_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        delivery_contact: `${formData.name}, ${formData.phone}`,
        notes: formData.notes,
        items: orderItems,
      })

      if (error) throw error

      // Clear cart and redirect to order confirmation
      clearCart()

      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id.slice(0, 8)} has been placed.`,
      })

      // Redirect to order details page
      router.push(`/retailer/orders/${data.id}`)
    } catch (error) {
      console.error("Failed to place order:", error)
      toast({
        title: "Error",
        description: "Failed to place your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">{t("Loading checkout...")}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t("Checkout")}</h1>
            <Button variant="outline" asChild>
              <Link href="/retailer/browse">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Continue Shopping")}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {t("Order Summary")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Wholesaler info */}
                  {wholesaler && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {wholesaler.profile_image ? (
                          <Image
                            src={wholesaler.profile_image || "/placeholder.svg"}
                            alt={wholesaler.business_name || wholesaler.name}
                            width={40}
                            height={40}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{wholesaler.business_name || wholesaler.name}</p>
                        <p className="text-sm text-gray-500">
                          {wholesaler.city}, {wholesaler.state}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.quantity} x {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.product.price)} / {item.product.unit}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.product.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Subtotal")}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Delivery Fee")}</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium text-lg">
                      <span>{t("Total")}</span>
                      <span>{formatCurrency(total + deliveryFee)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      {t("Delivery Information")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("Full Name")} *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("Phone Number")} *</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">{t("Delivery Address")} *</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{t("City")} *</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">{t("State")} *</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">{t("PIN Code")} *</Label>
                        <Input
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">{t("Order Notes")} (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder={t("Special instructions for delivery")}
                      />
                    </div>
                  </CardContent>

                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      {t("Payment Method")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod">{t("Cash on Delivery")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online">{t("Online Payment")}</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>

                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || items.length === 0}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("Processing...")}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t("Place Order")}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
