"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Search, Plus, Edit, Trash2, Eye, ArrowUpDown, Package, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useOffline } from "@/lib/offline-context"
import { getProductsByWholesaler, deleteProduct } from "@/lib/product-service"
import type { Product } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateDemoProducts } from "@/lib/demo-data-service"

function ProductsTable({
  products,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onView: (product: Product) => void
  isLoading: boolean
}) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)

  useEffect(() => {
    let result = [...products]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query)) ||
          (product.hsn_code && product.hsn_code.includes(query)),
      )
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn as keyof Product]
        const bValue = b[sortColumn as keyof Product]

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        } else {
          return 0
        }
      })
    }

    setFilteredProducts(result)
  }, [products, searchQuery, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <div className="p-4 border-b">
            <Skeleton className="h-8 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 border-b">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/wholesaler/products/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Link>
        </Button>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                  <div className="flex items-center">
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("price")}>
                  <div className="flex items-center justify-end">
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("stock_quantity")}>
                  <div className="flex items-center justify-end">
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort("is_active")}>
                  <div className="flex items-center justify-center">
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                      <Image
                        src={product.image_url || "/placeholder.svg?height=64&width=64&query=Product"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">{product.description}</div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category}</Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${product.stock_quantity <= 10 ? "text-red-600" : "text-green-600"}`}>
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.is_active ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => onView(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No products found</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery ? "Try adjusting your search query" : "Start by adding your first product to your catalog"}
          </p>
          {!searchQuery && (
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/wholesaler/products/new">
                <Plus className="mr-2 h-5 w-5" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function DeleteProductDialog({
  product,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium">{product.name}</span>? This action cannot be
            undone.
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
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WholesalerProductsContent() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { isOffline } = useOffline()
  const router = useRouter()

  // Add a key to force refresh when navigating back to this page
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        if (isOffline || !user) {
          // Use demo data in offline mode
          const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === "wholesaler-1")
          setProducts(demoProducts)
        } else {
          // Fetch from API in online mode
          const { data, error } = await getProductsByWholesaler(user.id)
          if (error) {
            console.error("Error loading products:", error)
            toast({
              title: "Error",
              description: "Using demo products instead of database data.",
              variant: "destructive",
            })
            // Fall back to demo data on error
            const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === "wholesaler-1")
            setProducts(demoProducts)
          } else if (data) {
            setProducts(data)
          }
        }
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Using demo products instead of database data.",
          variant: "destructive",
        })
        // Fall back to demo data on error
        const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === "wholesaler-1")
        setProducts(demoProducts)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [user, isOffline, refreshKey])

  // Force refresh when the component mounts or when the URL changes
  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [router])

  const handleViewProduct = (product: Product) => {
    router.push(`/wholesaler/products/${product.id}`)
  }

  const handleEditProduct = (product: Product) => {
    router.push(`/wholesaler/products/${product.id}`)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      const { error } = await deleteProduct(productToDelete.id)
      if (error) {
        console.error("Error deleting product:", error)
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
      } else {
        // Remove product from state
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
        toast({
          title: "Success",
          description: "Product deleted successfully.",
          variant: "default",
        })
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
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products}
            onView={handleViewProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <DeleteProductDialog
        product={productToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <Toaster />
    </div>
  )
}

export default function WholesalerProductsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <WholesalerProductsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
