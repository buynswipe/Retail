"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { deleteProduct } from "@/lib/product-service"
import { Package, Search, Plus, Edit, Trash2, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import type { Product } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function ProductsContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  const loadProducts = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("wholesaler_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleAddProduct = () => {
    router.push("/wholesaler/products/new")
  }

  const handleEditProduct = (productId: string) => {
    router.push(`/wholesaler/products/${productId}`)
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      const { success, error } = await deleteProduct(productToDelete.id)

      if (error) {
        throw error
      }

      if (success) {
        toast({
          title: "Product Deleted",
          description: "The product has been deleted successfully.",
        })
        // Remove the deleted product from the state
        setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productToDelete.id))
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setProductToDelete(null)
    }
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <Button onClick={handleAddProduct} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="mr-2 h-5 w-5" />
          Add New Product
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
          <span>Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't added any products yet. Start by adding your first product.
            </p>
            <Button onClick={handleAddProduct} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="mr-2 h-5 w-5" />
              Add New Product
            </Button>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
            <p className="text-gray-500 mb-6">No products matching "{searchQuery}" were found.</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-32 h-32 bg-gray-100">
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
                </div>
                <div className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-2">{product.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Stock: {product.stock_quantity}</Badge>
                        {product.category && <Badge variant="outline">{product.category}</Badge>}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p className="text-blue-600 font-bold text-lg">₹{product.price.toFixed(2)}</p>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product.id)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
