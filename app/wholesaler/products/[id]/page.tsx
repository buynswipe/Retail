"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { getProductById, updateProduct, deleteProduct } from "@/lib/product-service"
import { getInventoryForProduct } from "@/lib/inventory-service"
import { useTranslation } from "@/app/components/translation-provider"
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function ProductDetailsPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productData = await getProductById(productId)
        setProduct(productData)
        setImagePreview(productData.image_url)

        const inventoryData = await getInventoryForProduct(productId)
        setInventory(inventoryData)
      } catch (error) {
        console.error("Error fetching product details:", error)
        toast({
          title: t("Error"),
          description: t("Failed to load product details"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId, t])

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
    setSaving(true)
    try {
      // In a real app, you would upload the image to storage and get a URL
      // For now, we'll just use the existing URL or a placeholder
      const updatedProduct = {
        ...product,
        image_url: imagePreview || "/placeholder.png",
      }

      await updateProduct(productId, updatedProduct)
      toast({
        title: t("Success"),
        description: t("Product updated successfully"),
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: t("Error"),
        description: t("Failed to update product"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(t("Are you sure you want to delete this product?"))) {
      setDeleting(true)
      try {
        await deleteProduct(productId)
        toast({
          title: t("Success"),
          description: t("Product deleted successfully"),
        })
        router.push("/wholesaler/products")
      } catch (error) {
        console.error("Error deleting product:", error)
        toast({
          title: t("Error"),
          description: t("Failed to delete product"),
          variant: "destructive",
        })
        setDeleting(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t("Delete Product")}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("Save Changes")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">{t("Product Details")}</TabsTrigger>
          <TabsTrigger value="inventory">{t("Inventory")}</TabsTrigger>
          <TabsTrigger value="pricing">{t("Pricing")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Basic Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Product Name")}</Label>
                  <Input id="name" name="name" value={product.name || ""} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t("Category")}</Label>
                  <Select
                    value={product.category || ""}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="sku">{t("SKU")}</Label>
                  <Input id="sku" name="sku" value={product.sku || ""} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">{t("Barcode")}</Label>
                  <Input id="barcode" name="barcode" value={product.barcode || ""} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("Description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={product.description || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("Product Image")}</Label>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  {imagePreview && (
                    <div className="relative h-40 w-40 overflow-hidden rounded-md border">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt={product.name || "Product image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                    <p className="text-sm text-muted-foreground">{t("Recommended size: 800x800px. Max size: 2MB")}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={product.active || false}
                  onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                />
                <Label htmlFor="active">{t("Active (visible to retailers)")}</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Additional Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand">{t("Brand")}</Label>
                  <Input id="brand" name="brand" value={product.brand || ""} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">{t("Manufacturer")}</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={product.manufacturer || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">{t("Weight (kg)")}</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    value={product.weight || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">{t("Dimensions (LxWxH cm)")}</Label>
                  <Input
                    id="dimensions"
                    name="dimensions"
                    value={product.dimensions || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">{t("Tags (comma separated)")}</Label>
                <Input id="tags" name="tags" value={product.tags || ""} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Inventory Status")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_stock">{t("Current Stock")}</Label>
                  <div className="text-2xl font-bold">
                    {inventory?.total_quantity || 0} {t("units")}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("Last updated")}:{" "}
                    {inventory?.last_updated ? new Date(inventory.last_updated).toLocaleString() : t("Never")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock">{t("Minimum Stock Level")}</Label>
                  <Input
                    id="min_stock"
                    name="min_stock"
                    type="number"
                    value={product.min_stock || 0}
                    onChange={handleInputChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("You will be alerted when stock falls below this level")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t("Inventory Management")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "For detailed inventory management, including batch tracking and stock adjustments, please visit the Inventory section.",
                  )}
                </p>
                <Button variant="outline" onClick={() => router.push(`/wholesaler/inventory/${productId}`)}>
                  {t("Go to Inventory Management")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Pricing Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">{t("Cost Price (₹)")}</Label>
                  <Input
                    id="cost_price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    value={product.cost_price || ""}
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
                    value={product.selling_price || ""}
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
                    value={product.mrp || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate">{t("Tax Rate (%)")}</Label>
                  <Input
                    id="tax_rate"
                    name="tax_rate"
                    type="number"
                    step="0.01"
                    value={product.tax_rate || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">{t("Discount Type")}</Label>
                <Select
                  value={product.discount_type || "none"}
                  onValueChange={(value) => handleSelectChange("discount_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select discount type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("No Discount")}</SelectItem>
                    <SelectItem value="percentage">{t("Percentage")}</SelectItem>
                    <SelectItem value="fixed">{t("Fixed Amount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {product.discount_type && product.discount_type !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {product.discount_type === "percentage" ? t("Discount Percentage (%)") : t("Discount Amount (₹)")}
                  </Label>
                  <Input
                    id="discount_value"
                    name="discount_value"
                    type="number"
                    step="0.01"
                    value={product.discount_value || ""}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("Bulk Pricing")}</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_bulk_pricing"
                    checked={product.has_bulk_pricing || false}
                    onCheckedChange={(checked) => handleSwitchChange("has_bulk_pricing", checked)}
                  />
                  <Label htmlFor="has_bulk_pricing">{t("Enable bulk pricing")}</Label>
                </div>

                {product.has_bulk_pricing && (
                  <p className="text-sm text-muted-foreground">
                    {t("Bulk pricing configuration is available in the advanced pricing section")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
