"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getProductsByWholesaler } from "@/lib/product-service"
import { addProductBatch } from "@/lib/inventory-service"
import { ArrowLeft, Package, Calendar, DollarSign, Hash, Truck, ClipboardList } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddStockPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedProduct, setSelectedProduct] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [quantity, setQuantity] = useState("")
  const [manufacturingDate, setManufacturingDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await getProductsByWholesaler(user.id)
        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error("Failed to load products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedProduct || !batchNumber || !quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const batchData = {
        product_id: selectedProduct,
        batch_number: batchNumber,
        quantity: Number.parseInt(quantity),
        manufacturing_date: manufacturingDate || undefined,
        expiry_date: expiryDate || undefined,
        cost_price: costPrice ? Number.parseFloat(costPrice) : undefined,
        notes,
      }

      const { data, error } = await addProductBatch(batchData)
      if (error) throw error

      toast({
        title: "Success",
        description: "Stock has been added successfully.",
      })

      // Redirect to product inventory page
      router.push(`/wholesaler/inventory/${selectedProduct}`)
    } catch (error) {
      console.error("Failed to add stock:", error)
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate a unique batch number
  const generateBatchNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    setBatchNumber(`B${timestamp}${random}`)
  }

  useEffect(() => {
    generateBatchNumber()
  }, [selectedProduct])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-2">
              <Link href="/wholesaler/inventory/dashboard">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Back to Dashboard")}
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{t("Add New Stock")}</h1>
            <p className="text-gray-500">{t("Add new stock or create a new batch for existing products")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                {t("Stock Details")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Product Selection */}
                  <div>
                    <Label htmlFor="product">{t("Select Product")} *</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                      <SelectTrigger id="product" className="w-full">
                        <SelectValue placeholder={t("Select a product")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Batch Number */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="batch-number">{t("Batch Number")} *</Label>
                      <div className="flex">
                        <Input
                          id="batch-number"
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          placeholder={t("Enter batch number")}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>&nbsp;</Label>
                      <Button type="button" variant="outline" className="w-full" onClick={generateBatchNumber}>
                        <Hash className="mr-2 h-4 w-4" />
                        {t("Generate")}
                      </Button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity">{t("Quantity")} *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={t("Enter quantity")}
                      min="1"
                      required
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manufacturing-date">{t("Manufacturing Date")}</Label>
                      <div className="flex">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                        <Input
                          id="manufacturing-date"
                          type="date"
                          value={manufacturingDate}
                          onChange={(e) => setManufacturingDate(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expiry-date">{t("Expiry Date")}</Label>
                      <div className="flex">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                        <Input
                          id="expiry-date"
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cost Price */}
                  <div>
                    <Label htmlFor="cost-price">{t("Cost Price")}</Label>
                    <div className="flex">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                      <Input
                        id="cost-price"
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder={t("Enter cost price")}
                        step="0.01"
                        min="0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">{t("Notes")}</Label>
                    <div className="flex">
                      <ClipboardList className="h-5 w-5 text-gray-400 mr-2 mt-3" />
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("Enter any additional notes about this batch")}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" type="button" asChild>
                    <Link href="/wholesaler/inventory/dashboard">{t("Cancel")}</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>{t("Adding...")}</>
                    ) : (
                      <>
                        <Truck className="mr-2 h-5 w-5" />
                        {t("Add Stock")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
