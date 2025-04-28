"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Tag, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/product-service"
import { getCategories } from "@/lib/category-service"
import { useTranslation } from "@/app/components/translation-provider"

export default function ProductsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    sku: "",
    is_active: true,
    min_order_quantity: "1",
    unit: "piece",
    tax_rate: "18",
    has_variants: false,
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: t("Error"),
        description: t("Failed to load products. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_url: "",
      sku: "",
      is_active: true,
      min_order_quantity: "1",
      unit: "piece",
      tax_rate: "18",
      has_variants: false,
    })
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const newProduct = {
        ...formData,
        price: Number.parseFloat(formData.price),
        min_order_quantity: Number.parseInt(formData.min_order_quantity),
        tax_rate: Number.parseFloat(formData.tax_rate),
      }

      await createProduct(newProduct)
      toast({
        title: t("Success"),
        description: t("Product added successfully"),
      })
      setIsAddDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: t("Error"),
        description: t("Failed to add product. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const updatedProduct = {
        ...formData,
        id: currentProduct.id,
        price: Number.parseFloat(formData.price),
        min_order_quantity: Number.parseInt(formData.min_order_quantity),
        tax_rate: Number.parseFloat(formData.tax_rate),
      }

      await updateProduct(updatedProduct)
      toast({
        title: t("Success"),
        description: t("Product updated successfully"),
      })
      setIsEditDialogOpen(false)
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: t("Error"),
        description: t("Failed to update product. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    setIsLoading(true)
    try {
      await deleteProduct(currentProduct.id)
      toast({
        title: t("Success"),
        description: t("Product deleted successfully"),
      })
      setIsDeleteDialogOpen(false)
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: t("Error"),
        description: t("Failed to delete product. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (product) => {
    setCurrentProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category_id: product.category_id,
      image_url: product.image_url || "",
      sku: product.sku || "",
      is_active: product.is_active,
      min_order_quantity: product.min_order_quantity?.toString() || "1",
      unit: product.unit || "piece",
      tax_rate: product.tax_rate?.toString() || "18",
      has_variants: product.has_variants || false,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (product) => {
    setCurrentProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("Product Catalog")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("Add Product")}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder={t("Search products...")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t("Filter by category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Categories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="grid">{t("Grid")}</TabsTrigger>
          <TabsTrigger value="list">{t("List")}</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package size={64} className="text-gray-300" />
                      </div>
                    )}
                    {!product.is_active && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">{t("Inactive")}</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">{t("Open menu")}</span>
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                            >
                              <path
                                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("Edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/wholesaler/inventory/${product.id}`)}>
                            <Package className="mr-2 h-4 w-4" />
                            {t("Manage Inventory")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="font-bold">₹{product.price.toFixed(2)}</div>
                    {product.sku && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">SKU:</span> {product.sku}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">{t("No products found")}</h3>
              <p className="mt-1 text-gray-500">
                {t("Try adjusting your search or filter to find what you're looking for.")}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center p-4 border rounded-lg">
                  <div className="h-16 w-16 bg-gray-200 rounded mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="h-16 w-16 bg-gray-100 rounded mr-4 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold">{product.name}</h3>
                      {!product.is_active && (
                        <Badge variant="destructive" className="ml-2">
                          {t("Inactive")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      {product.sku && (
                        <span className="mr-3">
                          <span className="font-medium">SKU:</span> {product.sku}
                        </span>
                      )}
                      {categories.find((c) => c.id === product.category_id)?.name && (
                        <span className="flex items-center">
                          <Tag size={12} className="mr-1" />
                          {categories.find((c) => c.id === product.category_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-lg mr-4">₹{product.price.toFixed(2)}</div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/wholesaler/inventory/${product.id}`)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {t("Inventory")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("Edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(product)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">{t("No products found")}</h3>
              <p className="mt-1 text-gray-500">
                {t("Try adjusting your search or filter to find what you're looking for.")}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Add New Product")}</DialogTitle>
            <DialogDescription>{t("Fill in the details to add a new product to your catalog.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Product Name")} *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t("SKU")}</Label>
                  <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("Description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("Price")} (₹) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">{t("Category")} *</Label>
                  <Select
                    name="category_id"
                    value={formData.category_id}
                    onValueChange={(value) => handleSelectChange("category_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_quantity">{t("Min Order Quantity")}</Label>
                  <Input
                    id="min_order_quantity"
                    name="min_order_quantity"
                    type="number"
                    min="1"
                    value={formData.min_order_quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">{t("Unit")}</Label>
                  <Select
                    name="unit"
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">{t("Piece")}</SelectItem>
                      <SelectItem value="kg">{t("Kilogram")}</SelectItem>
                      <SelectItem value="g">{t("Gram")}</SelectItem>
                      <SelectItem value="l">{t("Liter")}</SelectItem>
                      <SelectItem value="ml">{t("Milliliter")}</SelectItem>
                      <SelectItem value="box">{t("Box")}</SelectItem>
                      <SelectItem value="pack">{t("Pack")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">{t("Tax Rate")} (%)</Label>
                  <Input
                    id="tax_rate"
                    name="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">{t("Image URL")}</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{t("Active (visible to retailers)")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_variants"
                  name="has_variants"
                  checked={formData.has_variants}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_variants: checked })}
                />
                <Label htmlFor="has_variants">{t("This product has variants")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("Adding...") : t("Add Product")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Edit Product")}</DialogTitle>
            <DialogDescription>{t("Update the details of your product.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t("Product Name")} *</Label>
                  <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">{t("SKU")}</Label>
                  <Input id="edit-sku" name="sku" value={formData.sku} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t("Description")}</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">{t("Price")} (₹) *</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category_id">{t("Category")} *</Label>
                  <Select
                    name="category_id"
                    value={formData.category_id}
                    onValueChange={(value) => handleSelectChange("category_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min_order_quantity">{t("Min Order Quantity")}</Label>
                  <Input
                    id="edit-min_order_quantity"
                    name="min_order_quantity"
                    type="number"
                    min="1"
                    value={formData.min_order_quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">{t("Unit")}</Label>
                  <Select
                    name="unit"
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">{t("Piece")}</SelectItem>
                      <SelectItem value="kg">{t("Kilogram")}</SelectItem>
                      <SelectItem value="g">{t("Gram")}</SelectItem>
                      <SelectItem value="l">{t("Liter")}</SelectItem>
                      <SelectItem value="ml">{t("Milliliter")}</SelectItem>
                      <SelectItem value="box">{t("Box")}</SelectItem>
                      <SelectItem value="pack">{t("Pack")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tax_rate">{t("Tax Rate")} (%)</Label>
                  <Input
                    id="edit-tax_rate"
                    name="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image_url">{t("Image URL")}</Label>
                  <Input
                    id="edit-image_url"
                    name="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">{t("Active (visible to retailers)")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-has_variants"
                  name="has_variants"
                  checked={formData.has_variants}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_variants: checked })}
                />
                <Label htmlFor="edit-has_variants">{t("This product has variants")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("Updating...") : t("Update Product")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Delete Product")}</DialogTitle>
            <DialogDescription>
              {t("Are you sure you want to delete this product? This action cannot be undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isLoading}>
              {isLoading ? t("Deleting...") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
