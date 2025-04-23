"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { ShoppingCart, Plus, Minus, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { getProducts } from "@/lib/product-service"
import type { Product } from "@/lib/product-service"
import Image from "next/image"
import ProductSearch from "./search"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

function BrowseContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [categories, setCategories] = useState<string[]>([])

  // Get wholesaler ID from URL if present
  const wholesalerId = searchParams.get("wholesaler")

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user, wholesalerId])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProducts(wholesalerId || undefined)
      if (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setProducts(data)
        setFilteredProducts(data)

        // Initialize quantities
        const initialQuantities: Record<string, number> = {}
        data.forEach((product) => {
          initialQuantities[product.id] = 0
        })
        setQuantities(initialQuantities)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map((product) => product.category)))
        setCategories(uniqueCategories as string[])
      }
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

  const handleSearch = (query: string, filters: any) => {
    let results = [...products]

    // Apply text search
    if (query) {
      const searchTerms = query.toLowerCase().split(" ")
      results = results.filter((product) => {
        return searchTerms.every(
          (term) =>
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term),
        )
      })
    }

    // Apply category filter
    if (filters.category) {
      results = results.filter((product) => product.category === filters.category)
    }

    // Apply price range filter
    results = results.filter(
      (product) => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1],
    )

    // Apply in-stock filter
    if (filters.inStock) {
      results = results.filter((product) => product.stock_quantity > 0)
    }

    // Apply discount filter
    if (filters.discount) {
      results = results.filter((product) => product.discount_percentage > 0)
    }

    // Apply sorting
    if (filters.sortBy === "price-low-high") {
      results.sort((a, b) => a.price - b.price)
    } else if (filters.sortBy === "price-high-low") {
      results.sort((a, b) => b.price - a.price)
    } else if (filters.sortBy === "newest") {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setFilteredProducts(results)
  }

  const incrementQuantity = (productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  const decrementQuantity = (productId: string) => {
    if (quantities[productId] > 0) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: prev[productId] - 1,
      }))
    }
  }

  const addToCart = (product: Product) => {
    if (quantities[product.id] > 0) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantities[product.id],
        wholesaler_id: product.wholesaler_id,
        wholesaler_name: product.wholesaler_name,
        image_url: product.image_url,
        discount_percentage: product.discount_percentage,
      })

      toast({
        title: "Added to cart",
        description: `${quantities[product.id]} x ${product.name} added to cart`,
      })

      // Reset quantity
      setQuantities((prev) => ({
        ...prev,
        [product.id]: 0,
      }))
    } else {
      toast({
        title: "Please select quantity",
        description: "Please select a quantity greater than 0",
        variant: "destructive",
      })
    }
  }

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    return price - price * (discountPercentage / 100)
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        <Button onClick={() => router.push("/retailer/checkout")} className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          View Cart
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-8">
        <ProductSearch onSearch={handleSearch} categories={categories} />
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-48 bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {product.discount_percentage > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500">{product.discount_percentage}% OFF</Badge>
                  )}
                  {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                    <Badge className="absolute top-2 left-2 bg-orange-500">Only {product.stock_quantity} left</Badge>
                  )}
                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge className="bg-gray-800 text-white text-lg px-4 py-2">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{product.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="mt-2">
                    {product.discount_percentage > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          ₹{calculateDiscountedPrice(product.price, product.discount_percentage).toFixed(2)}
                        </span>
                        <span className="text-gray-500 line-through">₹{product.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
                    )}
                    <p className="text-sm text-gray-500">
                      {product.unit_size} {product.unit_type}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => decrementQuantity(product.id)}
                        disabled={quantities[product.id] === 0 || product.stock_quantity === 0}
                        className="h-10 w-10 rounded-none"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{quantities[product.id] || 0}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => incrementQuantity(product.id)}
                        disabled={product.stock_quantity === 0 || quantities[product.id] >= product.stock_quantity}
                        className="h-10 w-10 rounded-none"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={quantities[product.id] === 0 || product.stock_quantity === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <Button
            onClick={() => {
              setFilteredProducts(products)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Reset Filters
          </Button>
        </div>
      )}
      <Toaster />
    </div>
  )
}

export default function BrowsePage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <BrowseContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
