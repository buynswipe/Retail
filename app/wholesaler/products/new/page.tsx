"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createProduct } from "@/lib/product-service"
import { useTranslation } from "@/app/components/translation-provider"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function NewProductPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    sku: "",
    barcode: "",
    brand: "",
    manufacturer: "",
    weight: "",
    dimensions: "",
    tags: "",
    cost_price: "",
    selling_price: "",
    mrp: "",
    tax_rate: "18", // Default GST rate
    min_stock: "10", // Default minimum stock
    active: true,
    discount_type: "none",
    discount_value: "",
    has_bulk_pricing: false,
  })

  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct({ ...product, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProduct({ ...product, [name]: value })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setProduct({ ...product, [name]: checked })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    // Basic validation
    if (!product.name) {
      toast({
        title: t("Validation Error"),
        description: t("Product name is required"),
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // In a real app, you would upload the image to storage and get a URL
      // For now, we'll just use a placeholder
      const newProduct = {
        ...product,
        image_url: imagePreview || "/placeholder.png",
      }

      const createdProduct = await createProduct(newProduct)
      toast({
        title: t("Success"),
        description: t("Product created successfully"),
      })
      router.push(`/wholesaler/products/${createdProduct.id}`)
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: t("Error"),
        description: t("Failed to create product"),
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/wholesaler/products")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to Products")}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("Create Product")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("New Product")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Product Name")} *</Label>
                <Input id="name" name="name" value={product.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t("Category")}</Label>
                <Select value={product.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groceries">{t("Groceries")}</SelectItem>
                    <SelectItem value="household">{t("Household")}</SelectItem>
                    <SelectItem value="personal_care">{t("Personal Care")}</SelectItem>
                    <SelectItem value="electronics">{t("Electronics")}</SelectItem>
                    <SelectItem value="clothing">{t("Clothing")}</SelectItem>
                    <SelectItem value="other">{t("Other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("Description")}</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={product.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("Product Image")}</Label>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {imagePreview ? (
                  <div className="relative h-40 w-40 overflow-hidden rounded-md border">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed">
                    <span className="text-sm text-muted-foreground">{t("No image")}</span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                  <p className="text-sm text-muted-foreground">{t("Recommended size: 800x800px. Max size: 2MB")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Inventory Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">{t("SKU")}</Label>
                  <Input id="sku" name="sku" value={product.sku} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">{t("Barcode")}</Label>
                  <Input id="barcode" name="barcode" value={product.barcode} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock">{t("Minimum Stock Level")}</Label>
                  <Input
                    id="min_stock"
                    name="min_stock"
                    type="number"
                    value={product.min_stock}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Product Details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">{t("Brand")}</Label>
                  <Input id="brand" name="brand" value={product.brand} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">{t("Manufacturer")}</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={product.manufacturer}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">{t("Weight (in grams)")}</Label>
                  <Input id="weight" name="weight" value={product.weight} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">{t("Dimensions (L x W x H cm)")}</Label>
                  <Input id="dimensions" name="dimensions" value={product.dimensions} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("Pricing Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">{t("Cost Price (₹)")}</Label>
                  <Input
                    id="cost_price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    value={product.cost_price}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selling_price">{t("Selling Price (₹)")}</Label>
                  <Input
                    id="selling_price"
                    name="selling_price"
                    type="number"
                    step="0.01"
                    value={product.selling_price}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mrp">{t("MRP (₹)")}</Label>
                  <Input
                    id="mrp"
                    name="mrp"
                    type="number"
                    step="0.01"
                    value={product.mrp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">{t("Tax Rate (%)")}</Label>
                  <Select value={product.tax_rate} onValueChange={(value) => handleSelectChange("tax_rate", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select tax rate")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t("0% (Exempt)")}</SelectItem>
                      <SelectItem value="5">{t("5% GST")}</SelectItem>
                      <SelectItem value="12">{t("12% GST")}</SelectItem>
                      <SelectItem value="18">{t("18% GST")}</SelectItem>
                      <SelectItem value="28">{t("28% GST")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">{t("Discount Type")}</Label>
                  <Select
                    value={product.discount_type}
                    onValueChange={(value) => handleSelectChange("discount_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select discount type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("None")}</SelectItem>
                      <SelectItem value="percentage">{t("Percentage")}</SelectItem>
                      <SelectItem value="fixed">{t("Fixed Amount")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {product.discount_type !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      {product.discount_type === "percentage" ? t("Discount Percentage (%)") : t("Discount Amount (₹)")}
                    </Label>
                    <Input
                      id="discount_value"
                      name="discount_value"
                      type="number"
                      step="0.01"
                      value={product.discount_value}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
