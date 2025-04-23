"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Plus, Edit, Trash2, ImageIcon, Package, Search, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getProductsByWholesaler,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "@/lib/product-service"
import type { Product } from "@/lib/product-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Switch } from "@/components/ui/switch"

function ProductsContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    image_url: "",
    is_active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  const loadProducts = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getProductsByWholesaler(user.id)
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setProducts(data)
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      stock_quantity: "",
      image_url: "",
      is_active: true,
    })
    setImageFile(null)
    setImagePreview(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || "",
      is_active: product.is_active,
    })
    setImageFile(null)
    setImagePreview(product.image_url || null)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
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
    if (!user) return

    try {
      // Validate form
      if (!formData.name || !formData.price || !formData.stock_quantity) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Upload image if selected
      let imageUrl = formData.image_url
      if (imageFile) {
        const { url, error } = await uploadProductImage(imageFile)
        if (error) {
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          })
          return
        }
        imageUrl = url || ""
      }

      if (selectedProduct) {
        // Update existing product
        const { data, error } = await updateProduct(selectedProduct.id, {
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          stock_quantity: Number.parseInt(formData.stock_quantity),
          image_url: imageUrl,
          is_active: formData.is_active,
        })

        if (error) {
          toast({
            title: "Error",
            description: "Failed to update product. Please try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Success",
            description: "Product updated successfully.",
          })

          // Update products list
          setProducts(products.map((p) => (p.id === selectedProduct.id ? data! : p)))
          setIsDialogOpen(false)
        }
      } else {
        // Create new product
        const { data, error } = await createProduct(user.id, {
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          stock_quantity: Number.parseInt(formData.stock_quantity),
          image_url: imageUrl,
        })

        if (error) {
          toast({
            title: "Error",
            description: "Failed to create product. Please try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Success",
            description: "Product created successfully.",
          })

          // Update products list
          if (data) {
            setProducts([data, ...products])
          }
          setIsDialogOpen(false)
        }
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return

    try {
      const { success, error } = await deleteProduct(selectedProduct.id)

      if (error || !success) {
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Product deleted successfully.",
        })

        // Update products list
        setProducts(products.filter((p) => p.id !== selectedProduct.id))
        setIsDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <Button onClick={handleAddProduct} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">
            {searchQuery ? "No products match your search" : "No products yet. Add your first product!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`overflow-hidden ${!product.is_active ? "opacity-60" : ""}`}>
              <div className="aspect-video relative bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {!product.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Inactive</div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-semibold mb-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? "Update your product details below"
                : "Fill in the details to add a new product to your catalog"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
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
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative w-16 h-16">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                        setFormData({ ...formData, image_url: "" })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image")?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>
            {selectedProduct && (
              <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600">
              {selectedProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <ProductsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
