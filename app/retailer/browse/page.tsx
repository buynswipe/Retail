"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Search, ShoppingCart, Plus, Minus, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import { useOffline } from "@/lib/offline-context"
import { getAllProducts } from "@/lib/product-service"
import { filterProducts, getUniqueCategories, getPriceRange } from "@/lib/product-search"
import type { Product } from "@/lib/types"
import type { SearchFilters } from "@/lib/product-search"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { generateDemoProducts } from "@/lib/demo-data-service"

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) {
  const [quantity, setQuantity] = useState(1)
  const { t } = useTranslation()
  const { cartItems } = useCart()

  // Check if product is already in cart
  const cartItem = cartItems.find((item) => item.product_id === product.id)
  const isInCart = !!cartItem

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity })
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="relative pt-[100%]">
        <Link href={`/retailer/browse/${product.id}`}>
          <Image
            src={product.image_url || "/placeholder.svg?height=200&width=200&query=Product"}
            alt={product.name}
            fill
            className="object-cover p-4"
          />
        </Link>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <Link href={`/retailer/browse/${product.id}`} className="hover:underline">
            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
          </Link>
          <p className="text-gray-500 text-sm line-clamp-2 mt-1">{product.description}</p>
          {product.category && (
            <Badge variant="outline" className="mt-2">
              {product.category}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold">₹{product.price}</p>
            <div className="text-sm text-gray-500">GST: {product.gst_rate || 0}%</div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={handleIncrement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className={isInCart ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              {isInCart ? t("update.cart") : t("add.to.cart")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="relative pt-[100%]">
        <Skeleton className="absolute inset-0 m-4" />
      </div>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-5 w-16 mt-2" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-7 w-20" />
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterPanel({
  filters,
  setFilters,
  categories,
  priceRange,
  onApplyFilters,
  onResetFilters,
}: {
  filters: SearchFilters
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
  categories: string[]
  priceRange: { min: number; max: number }
  onApplyFilters: () => void
  onResetFilters: () => void
}) {
  const { t } = useTranslation()
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || priceRange.min)
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || priceRange.max)

  const handlePriceChange = (values: number[]) => {
    setLocalMinPrice(values[0])
    setLocalMaxPrice(values[1])
  }

  const handleApply = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
    }))
    onApplyFilters()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-categories"
              checked={!filters.category || filters.category === "all"}
              onCheckedChange={() => setFilters((prev) => ({ ...prev, category: "all" }))}
            />
            <Label htmlFor="all-categories">All Categories</Label>
          </div>
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.category === category}
                onCheckedChange={() => setFilters((prev) => ({ ...prev, category }))}
              />
              <Label htmlFor={`category-${category}`}>{category}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={[localMinPrice, localMaxPrice]}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            onValueChange={handlePriceChange}
            className="my-6"
          />
          <div className="flex items-center justify-between">
            <div className="border rounded-md p-2">₹{localMinPrice}</div>
            <div className="text-gray-500">to</div>
            <div className="border rounded-md p-2">₹{localMaxPrice}</div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Sort By</h3>
        <Select
          value={filters.sortBy || ""}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value as any }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Apply Filters
        </Button>
        <Button onClick={onResetFilters} variant="outline" className="flex-1">
          Reset
        </Button>
      </div>
    </div>
  )
}

function RetailerBrowseContent() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [categories, setCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 })
  const [showFilters, setShowFilters] = useState(false)
  const { addToCart, updateCartItem, cartItems } = useCart()
  const { isOffline } = useOffline()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get wholesaler ID from URL if present
  useEffect(() => {
    const wholesalerId = searchParams.get("wholesaler")
    if (wholesalerId) {
      setFilters((prev) => ({ ...prev, wholesalerId }))
    }
  }, [searchParams])

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        if (isOffline) {
          // Use demo data in offline mode
          const demoProducts = generateDemoProducts()
          setProducts(demoProducts)

          // Extract categories and price range
          setCategories(getUniqueCategories(demoProducts))
          setPriceRange(getPriceRange(demoProducts))

          // Apply initial filters
          setFilteredProducts(filterProducts(demoProducts, filters))
        } else {
          // Fetch from API in online mode
          const { data, error } = await getAllProducts()
          if (error) {
            console.error("Error loading products:", error)
          } else if (data) {
            setProducts(data)

            // Extract categories and price range
            setCategories(getUniqueCategories(data))
            setPriceRange(getPriceRange(data))

            // Apply initial filters
            setFilteredProducts(filterProducts(data, filters))
          }
        }
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [isOffline])

  // Apply filters when they change
  useEffect(() => {
    if (products.length > 0) {
      const filtered = filterProducts(products, { ...filters, query: searchQuery })
      setFilteredProducts(filtered)
    }
  }, [filters, products])

  // Handle search
  const handleSearch = () => {
    const filtered = filterProducts(products, { ...filters, query: searchQuery })
    setFilteredProducts(filtered)
  }

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.product_id === product.id)

    if (existingItem) {
      updateCartItem({
        ...existingItem,
        quantity: product.quantity || 1,
      })
    } else {
      addToCart({
        user_id: "current-user", // This will be replaced with actual user ID in the cart context
        product_id: product.id,
        quantity: product.quantity || 1,
        product,
      })
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({})
    setSearchQuery("")
    setFilteredProducts(products)
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        <Button asChild variant="outline" className="hidden md:flex">
          <Link href="/retailer/checkout">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Cart ({cartItems.length})
          </Link>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-12 text-lg"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="h-12 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12">
                <SlidersHorizontal className="mr-2 h-5 w-5" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filter Products</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                  priceRange={priceRange}
                  onApplyFilters={() => {}}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Button asChild className="md:hidden h-12 bg-blue-600 hover:bg-blue-700">
            <Link href="/retailer/checkout">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Applied Filters */}
      {(filters.category || filters.minPrice || filters.maxPrice || filters.sortBy) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.category && filters.category !== "all" && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Category: {filters.category}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => setFilters((prev) => ({ ...prev, category: undefined }))}
              >
                ×
              </Button>
            </Badge>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Price: ₹{filters.minPrice || priceRange.min} - ₹{filters.maxPrice || priceRange.max}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => setFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }))}
              >
                ×
              </Button>
            </Badge>
          )}
          {filters.sortBy && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Sort: {filters.sortBy.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => setFilters((prev) => ({ ...prev, sortBy: undefined }))}
              >
                ×
              </Button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-sm">
            Clear All
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No products found</h2>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
          <Button onClick={handleResetFilters} className="bg-blue-600 hover:bg-blue-700">
            Reset Filters
          </Button>
        </div>
      )}

      {/* Mobile Cart Button */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <Button asChild className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700">
          <Link href="/retailer/checkout">
            <ShoppingCart className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function RetailerBrowsePage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <RetailerBrowseContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
