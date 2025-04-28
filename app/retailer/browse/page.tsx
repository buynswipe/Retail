"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useOffline } from "@/lib/offline-context"
import { supabase } from "@/lib/supabase-client"
import { Package, Search, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

function BrowseContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addItem, removeItem, updateQuantity, items, setWholesaler } = useCart()
  const { isOnline } = useOffline()
  const [products, setProducts] = useState<Product[]>([])
  const [wholesalers, setWholesalers] = useState<{ id: string; name: string }[]>([])
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWholesalers, setIsLoadingWholesalers] = useState(true)

  // Load wholesalers on initial render
  useEffect(() => {
    loadWholesalers()
  }, [])

  // Load products when wholesaler is selected
  useEffect(() => {
    if (selectedWholesaler) {
      loadProducts(selectedWholesaler)
    } else {
      setProducts([])
      setIsLoading(false)
    }
  }, [selectedWholesaler])

  const loadWholesalers = async () => {
    setIsLoadingWholesalers(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, business_name")
        .eq("role", "wholesaler")
        .eq("is_approved", true)
        .order("business_name")

      if (error) {
        throw error
      }

      setWholesalers(
        data.map((w) => ({
          id: w.id,
          name: w.business_name || "Unnamed Wholesaler",
        })),
      )
    } catch (error) {
      console.error("Error loading wholesalers:", error)
      toast({
        title: "Error",
        description: "Failed to load wholesalers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWholesalers(false)
    }
  }

  const loadProducts = async (wholesalerId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("wholesaler_id", wholesalerId)
        .eq("is_active", true)
        .order("name")

      if (error) {
        throw error
      }

      setProducts(data)

      // Get wholesaler name
      const { data: wholesalerData } = await supabase
        .from("users")
        .select("business_name")
        .eq("id", wholesalerId)
        .single()

      if (wholesalerData) {
        setWholesaler(wholesalerId, wholesalerData.business_name || "Unnamed Wholesaler")
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

  const handleWholesalerChange = (value: string) => {
    setSelectedWholesaler(value)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleAddToCart = (product: Product) => {
    addItem(product, 1)
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId)
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity)
  }

  const getProductQuantityInCart = (productId: string): number => {
    const item = items.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleViewCart = () => {
    router.push("/retailer/checkout")
  }

  const handleViewProductDetails = (productId: string) => {
    router.push(`/retailer/browse/${productId}`)
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        {items.length > 0 && (
          <Button onClick={handleViewCart} className="bg-blue-500 hover:bg-blue-600">
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Cart ({items.length} items)
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium mb-1 block">Select Wholesaler</label>
              <Select value={selectedWholesaler} onValueChange={handleWholesalerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a wholesaler" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingWholesalers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : wholesalers.length > 0 ? (
                    wholesalers.map((wholesaler) => (
                      <SelectItem key={wholesaler.id} value={wholesaler.id}>
                        {wholesaler.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500">No wholesalers found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                  disabled={!selectedWholesaler}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedWholesaler ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Select a Wholesaler</h2>
          <p className="text-gray-500">Please select a wholesaler to browse their products.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
          <span>Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Products Found</h2>
          <p className="text-gray-500">
            {searchQuery
              ? `No products matching "${searchQuery}" were found.`
              : "This wholesaler doesn't have any products yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const quantityInCart = getProductQuantityInCart(product.id)
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="h-48 bg-gray-100 cursor-pointer" onClick={() => handleViewProductDetails(product.id)}>
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
                <CardContent className="p-4">
                  <div className="mb-4 cursor-pointer" onClick={() => handleViewProductDetails(product.id)}>
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                    {product.description && <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>}
                    <p className="text-blue-600 font-bold mt-2">₹{product.price.toFixed(2)}</p>
                  </div>

                  {product.stock_quantity > 0 ? (
                    quantityInCart > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (quantityInCart === 1) {
                                handleRemoveFromCart(product.id)
                              } else {
                                handleUpdateQuantity(product.id, quantityInCart - 1)
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-3 font-medium">{quantityInCart}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(product.id, quantityInCart + 1)}
                            disabled={quantityInCart >= product.stock_quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" onClick={() => handleViewProductDetails(product.id)}>
                          Details
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleAddToCart(product)} className="w-full bg-blue-500 hover:bg-blue-600">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    )
                  ) : (
                    <Button disabled className="w-full">
                      Out of Stock
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
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
