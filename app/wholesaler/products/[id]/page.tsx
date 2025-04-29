"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { getProductById, updateProduct, deleteProduct } from "@/lib/product-service"
import { ArrowLeft, Package, Save, Trash2, Loader2, AlertCircle } from "lucide-react"
import Navbar from "../../../components/navbar"
import { TranslationProvider } from "../../../components/translation-provider"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOffline } from "@/lib/offline-context"
import { generateDemoProducts } from "@/lib/demo-data-service"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { isOffline } = useOffline()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    hsn_code: "",
    gst_rate: "",
    image_url: "",
    is_active: true,
    wholesaler_id: "",
  })

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        if (isOffline) {
          // Use demo data in offline mode
          const demoProducts = generateDemoProducts()
          const product = demoProducts.find((p) => p.id === params.id)
          if (product) {
            setFormData({
              ...product,
              price: product.price.toString(),
              stock_quantity: product.stock_quantity.toString(),
              gst_rate: product.gst_rate ? product.gst_rate.toString() : "",
            })
          } else {
            toast({
              title: "Error",
              description: "Product not found.",
              variant: "destructive",
            })
            router.push("/wholesaler/products")
          }
        } else {
          // Fetch from API in online mode
          const { data, error } = await getProductById(params.id)
          if (error) {
            console.error("Error loading product:", error)
            toast({
              title: "Error",
              description: "Failed to load product details.",
              variant: "destructive",
            })
            router.push("/wholesaler/products")
          } else if (data) {
            setFormData({
              ...data,
              price: data.price.toString(),
              stock_quantity: data.stock_quantity.toString(),
              gst_rate: data.gst_rate ? data.gst_rate.toString() : "",
            })
          }
        }
      } catch (error) {
        console.error("Error loading product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        })
        router.push("/wholesaler/products")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params.id, router, isOffline])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_active: checked,
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Validate form
      if (!formData.name || !formData.price || !formData.stock_quantity) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const productData = {
        ...formData,
        price: Number(formData.price),
        stock_quantity: Number(formData.stock_quantity),
        gst_rate: formData.gst_rate ? Number(formData.gst_rate) : undefined,
      }

      const { error } = await updateProduct(params.id, productData)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Product updated successfully.",
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await deleteProduct(params.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Product deleted successfully.",
      })

      // Navigate back to products list after short delay
      setTimeout(() => {
        router.push("/wholesaler/products")
      }, 1500)
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <TranslationProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            </div>
          </main>
        </div>
      </TranslationProvider>
    )
  }

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={() => router.push("/wholesaler/products")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Edit Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Image */}
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="w-full md:w-1/3 aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                      {formData.image_url ? (
                        <Image
                          src={formData.image_url || "/placeholder.svg"}
                          alt={formData.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">To change the product image, please contact support.</p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      placeholder="Enter product description"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                      <Input
                        id="stock_quantity"
                        name="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., Groceries, Snacks"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hsn_code">HSN Code</Label>
                      <Input
                        id="hsn_code"
                        name="hsn_code"
                        value={formData.hsn_code || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., 1704"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst_rate">GST Rate (%)</Label>
                      <Input
                        id="gst_rate"
                        name="gst_rate"
                        type="number"
                        value={formData.gst_rate || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., 18"
                        min="0"
                        max="28"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Status */}
                <div className="flex items-center space-x-2 pt-4">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {formData.is_active
                      ? "Product is active and visible to retailers"
                      : "Product is inactive and hidden from retailers"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Product</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete <span className="font-medium">{formData.name}</span>? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-4 py-4">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                  <div>
                    <p className="font-medium">This will permanently delete the product from your catalog.</p>
                    <p className="text-gray-500 mt-1">
                      If you want to temporarily hide the product, consider marking it as inactive instead.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Product"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Toaster />
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
