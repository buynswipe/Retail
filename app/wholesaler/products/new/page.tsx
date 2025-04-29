"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { ArrowLeft, Upload, Save, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useOffline } from "@/lib/offline-context"
import { createProduct } from "@/lib/product-service"
import { productCategories } from "@/lib/demo-data-service"
import Link from "next/link"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function AddProductForm() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isOffline } = useOffline()
  const router = useRouter()

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

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData.stock_quantity.trim()) {
      newErrors.stock_quantity = "Stock quantity is required"
    } else if (isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = "Stock quantity must be a non-negative number"
    }

    if (formData.gst_rate.trim() && (isNaN(Number(formData.gst_rate)) || Number(formData.gst_rate) < 0)) {
      newErrors.gst_rate = "GST rate must be a non-negative number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // In a real app, we would upload the image to storage and get a URL
      // For demo purposes, we'll use a placeholder image
      const imageUrl = imagePreview || "/abstract-geometric-sculpture.png"

      // Use a fixed demo wholesaler ID to avoid permission issues
      const productData = {
        wholesaler_id: "wholesaler-1", // Use a fixed demo ID to avoid permission issues
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock_quantity: Number(formData.stock_quantity),
        image_url: imageUrl,
        category: formData.category || "Groceries",
        is_active: formData.is_active,
      }

      // Call the createProduct function which now uses mock data
      const { data, error } = await createProduct(productData)

      if (error) {
        console.error("Error creating product:", error)
        toast({
          title: "Error",
          description: "Failed to create product. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Product added successfully.",
          variant: "default",
        })

        // Navigate to the products list page
        setTimeout(() => {
          router.push("/wholesaler/products")
        }, 1500)
      }
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Image upload */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Product preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-sm text-gray-500">Upload a high-quality image to showcase your product.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Product details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => handleSelectChange("is_active", value === "active" ? "true" : "false")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock_quantity"
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={errors.stock_quantity ? "border-red-500" : ""}
                  />
                  {errors.stock_quantity && <p className="text-sm text-red-500">{errors.stock_quantity}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input
                    id="hsn_code"
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleInputChange}
                    placeholder="Enter HSN code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst_rate">GST Rate (%)</Label>
                  <Input
                    id="gst_rate"
                    name="gst_rate"
                    type="number"
                    min="0"
                    max="28"
                    value={formData.gst_rate}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={errors.gst_rate ? "border-red-500" : ""}
                  />
                  {errors.gst_rate && <p className="text-sm text-red-500">{errors.gst_rate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" asChild>
          <Link href="/wholesaler/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Product
            </>
          )}
        </Button>
      </div>

      <Toaster />
    </form>
  )
}

export default function AddProductPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Add New Product</h1>
              <p className="text-gray-500 mt-2">
                Create a new product to add to your catalog. Fill in the details below.
              </p>
            </div>

            <AddProductForm />
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
