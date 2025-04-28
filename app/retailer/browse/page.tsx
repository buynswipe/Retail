"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useSafeTranslation } from "@/lib/use-safe-translation"
import { useOffline } from "@/lib/offline-context"
import Navbar from "@/app/components/navbar"
import { CartDrawer } from "@/app/components/cart/cart-drawer"
import { getWholesalers } from "@/lib/user-service"
import { getProductsByWholesaler } from "@/lib/product-service"
import type { Product, User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Search, Package, ShoppingCart, Filter, Store, Check, AlertTriangle, X } from "lucide-react"
import Image from "next/image"
import { OfflineProductList } from "@/app/components/offline-product-list"

// Add dynamic export to prevent static generation
export const dynamic = "force-dynamic"

export default function BrowsePage() {
  const { t } = useSafeTranslation() // Use our safe translation hook
  const { user } = useAuth()
  const { addItem, items } = useCart()
  const { isOffline } = useOffline()
  const [isMounted, setIsMounted] = useState(false)

  const [wholesalers, setWholesalers] = useState<User[]>([])
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>("")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load wholesalers on initial render
  useEffect(() => {
    if (!isMounted) return

    const loadWholesalers = async () => {
      try {
        const { data, error } = await getWholesalers()
        if (error) throw error
        setWholesalers(data || [])

        // Select the first wholesaler by default
        if (data && data.length > 0) {
          setSelectedWholesaler(data[0].id)
        }
      } catch (error) {
        console.error("Failed to load wholesalers:", error)
        toast({
          title: "Error",
          description: "Failed to load wholesalers. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (!isOffline) {
      loadWholesalers()
    }
  }, [isOffline, isMounted])

  // Load products when a wholesaler is selected
  useEffect(() => {
    if (!isMounted || !selectedWholesaler) return

    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getProductsByWholesaler(selectedWholesaler)
        if (error) throw error

        // Filter out inactive products
        const activeProducts = (data || []).filter((product) => product.is_active)
        setProducts(activeProducts)
        setFilteredProducts(activeProducts)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(activeProducts.map((p) => p.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Failed to load products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!isOffline) {
      loadProducts()
    }
  }, [selectedWholesaler, isOffline, isMounted])

  // Filter products based on search query and category
  useEffect(() => {
    if (!isMounted) return

    let filtered = [...products]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [searchQuery, categoryFilter, products, isMounted])

  const handleAddToCart = (product: Product) => {
    addItem(product, 1)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const isInCart = (productId: string) => {
    return items.some((item) => item.product.id === productId)
  }

  // Show loading state during SSR or when not mounted
  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isOffline) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">{t("Browse Products")}</h1>
              <CartDrawer />
            </div>
            <OfflineProductList />
          </div>
        </main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t("Browse Products")}</h1>
            <CartDrawer />
          </div>

          {/* Wholesaler Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("Select Wholesaler")}</label>
            <div className="flex gap-4 flex-wrap">
              {wholesalers.map((wholesaler) => (
                <Card
                  key={wholesaler.id}
                  className={`cursor-pointer transition-all ${
                    selectedWholesaler === wholesaler.id ? "ring-2 ring-primary" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedWholesaler(wholesaler.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      {wholesaler.profile_image ? (
                        <Image
                          src={wholesaler.profile_image || "/placeholder.svg"}
                          alt={wholesaler.business_name || wholesaler.name}
                          width={48}
                          height={48}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{wholesaler.business_name || wholesaler.name}</h3>
                      <p className="text-sm text-gray-500">
                        {wholesaler.city}, {wholesaler.state}
                      </p>
                    </div>
                    {selectedWholesaler === wholesaler.id && <Check className="h-5 w-5 text-primary ml-auto" />}
                  </CardContent>
                </Card>
              ))}

              {wholesalers.length === 0 && !isLoading && (
                <div className="text-center py-8 w-full">
                  <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg text-gray-500">{t("No wholesalers found")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          {selectedWholesaler && (
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t("Search products...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
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

                {categories.length > 0 && (
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-12 w-full md:w-[180px]">
                        <SelectValue placeholder={t("All Categories")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("All Categories")}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {categories.length > 0 && (
                <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="overflow-x-auto">
                  <TabsList className="h-auto p-1">
                    <TabsTrigger value="all" className="px-3 py-1.5">
                      {t("All")}
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger key={category} value={category} className="px-3 py-1.5">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">{t("Loading products...")}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery || categoryFilter !== "all"
                  ? t("No products match your search")
                  : t("No products available")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden flex flex-col">
                  <div className="h-48 bg-gray-100 relative">
                    {product.image_url ? (
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {product.category && <Badge className="absolute top-2 left-2">{product.category}</Badge>}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                    )}
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-lg">
                          {formatCurrency(product.price)}
                          <span className="text-sm font-normal text-gray-500 ml-1">/ {product.unit}</span>
                        </p>
                        <div className="text-sm">
                          {product.stock_quantity > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {t("In Stock")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t("Out of Stock")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity <= 0 || isInCart(product.id)}
                      >
                        {isInCart(product.id) ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t("Added to Cart")}
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {t("Add to Cart")}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
