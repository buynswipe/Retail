"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getProductById, updateProduct, uploadProductImage } from "@/lib/product-service"
import { ArrowLeft, Package, Save, ImageIcon, Loader2, X } from "lucide-react"
import type { Product } from "@/lib/types"

export default function ProductDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    hsn_code: "",
    gst_rate: "",
    is_active: true,
  })

  useEffect(() => {
    if (id) {
      loadProductDetails(id as string)
    }
  }, [id])

  const loadProductDetails = async (productId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await getProductById(productId)
      if (error) {
        throw error
      }

      if (!data) {
        throw new Error("Product not found")
      }

      // Check if the product belongs to the current user
      if (user && data.wholesaler_id !== user.id) {
        throw new Error("You don't have permission to edit this product")
      }

      setProduct(data)
      setFormData({
        name: data.name,
        description: data.description || "",
        price: data.price.toString(),
        stock_quantity: data.stock_quantity.toString(),
        category: data.category || "",
        hsn_code: data.hsn_code || "",
        gst_rate: data.gst_rate ? data.gst_rate.toString() : "",
        is_active: data.is_active,
      })
      setImagePreview(data.image_url || null)
    } catch (error) {
      console.error("Error loading product details:", error)
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      })
      router.push("/wholesaler/products")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!product || !user) return

    setIsSaving(true)
    try {
      // Validate form
      if (!formData.name || !formData.price || !formData.stock_quantity) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Upload image if selected
      let imageUrl = product.image_url
      if (imageFile) {
        const { url, error } = await uploadProductImage(imageFile)
        if (error) {
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
        imageUrl = url || ""
      }

      // Update product
      const { data, error } = await updateProduct(product.id, {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock_quantity: Number.parseInt(formData.stock_quantity),
        category: formData.category || undefined,
        hsn_code: formData.hsn_code || undefined,
        gst_rate: formData.gst_rate ? Number.parseFloat(formData.gst_rate) : undefined,
        image_url: imageUrl,
        is_active: formData.is_active,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Product updated successfully.",
      })

      // Update local product state
      if (data) {
        setProduct(data)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading product details...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/wholesaler/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/wholesaler/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600" disabled={isSaving}>
          {isSaving ? (
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
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt={formData.name}
                      className="w-full h-full object-contain"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                  className="w-full mb-2"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-sm text-gray-500">Recommended size: 800x800 pixels. Max file size: 5MB.</p>
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
                value={formData.description}
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
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Groceries, Snacks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  name="hsn_code"
                  value={formData.hsn_code}
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
                  value={formData.gst_rate}
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
    </div>
  )
}
