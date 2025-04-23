"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Search, MapPin, Package, ShoppingCart, Plus, Minus, X, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { supabase } from "@/lib/supabase-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Wholesaler {
  id: string
  name: string
  business_name: string
  distance?: number
  pin_code: string
  rating?: number
}

interface Product {
  id: string
  wholesaler_id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  image_url: string | null
  is_active: boolean
}

function BrowseContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    wholesalerId,
    wholesalerName,
    setWholesaler,
    totalItems,
    totalAmount,
  } = useCart()
  const [pinCode, setPinCode] = useState("")
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedWholesaler, setSelectedWholesaler] = useState<Wholesaler | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [sortOption, setSortOption] = useState<string>("name-asc")

  useEffect(() => {
    if (user) {
      // Load user's pin code
      setPinCode(user.pinCode || "")
    }
  }, [user])

  useEffect(() => {
    // If wholesalerId is set in cart, load that wholesaler
    if (wholesalerId && wholesalerName) {
      loadWholesalerProducts(wholesalerId)
      setSelectedWholesaler({
        id: wholesalerId,
        name: "",
        business_name: wholesalerName,
        pin_code: "",
      })
    }
  }, [wholesalerId, wholesalerName])

  const searchWholesalers = async () => {
    if (!pinCode) {
      toast({
        title: "Error",
        description: "Please enter a PIN code to search for wholesalers.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real app, this would search for wholesalers by pin code
      const { data, error } = await supabase
        .from("users")
        .select("id, name, business_name, pin_code")
        .eq("role", "wholesaler")
        .eq("is_approved", true)
        .eq("pin_code", pinCode)

      if (error) {
        throw error
      }

      // Add mock distance and rating for UI
      const wholesalersWithDetails = data.map((w) => ({
        ...w,
        distance: Math.round(Math.random() * 10 * 10) / 10, // Random distance between 0-10 km
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // Random rating between 3.5-5
      }))

      setWholesalers(wholesalersWithDetails)
      setSelectedWholesaler(null)
      setProducts([])
    } catch (error) {
      console.error("Error searching wholesalers:", error)
      toast({
        title: "Error",
        description: "Failed to search wholesalers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, this would call an API to get pin code from coordinates
          // For demo, we'll just set a dummy pin code
          setPinCode("400001")
          searchWholesalers()
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Error",
            description: "Unable to get your location. Please enter your PIN code manually.",
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser. Please enter your PIN code manually.",
        variant: "destructive",
      })
    }
  }

  const loadWholesalerProducts = async (wholesalerId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("wholesaler_id", wholesalerId)
        .eq("is_active", true)

      if (error) {
        throw error
      }

      setProducts(data)
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

  const handleSelectWholesaler = (wholesaler: Wholesaler) => {
    setSelectedWholesaler(wholesaler)
    setWholesaler(wholesaler.id, wholesaler.business_name || wholesaler.name)
    loadWholesalerProducts(wholesaler.id)
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
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, quantity)
    }
  }

  const getItemQuantity = (productId: string) => {
    const item = items.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        default:
          return 0
      }
    })

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button className="relative">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {totalItems > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500">{totalItems}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
              <SheetDescription>
                {wholesalerName ? `Items from ${wholesalerName}` : "Your shopping cart is empty"}
              </SheetDescription>
            </SheetHeader>

            {items.length > 0 ? (
              <>
                <div className="flex flex-col gap-4 py-4 overflow-y-auto max-h-[calc(100vh-250px)]">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 border-b pb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">₹{item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery Fee</span>
                    <span>₹50.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{(totalAmount + 50).toFixed(2)}</span>
                  </div>
                </div>

                <SheetFooter className="pt-4">
                  <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                    <Link href="/retailer/checkout">Proceed to Checkout</Link>
                  </Button>
                </SheetFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter PIN code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="pl-10 h-12 text-lg w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={searchWholesalers}
                className="h-12 bg-blue-500 hover:bg-blue-600 whitespace-nowrap"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={useCurrentLocation}
                className="h-12 whitespace-nowrap"
                disabled={isLoading}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Use GPS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wholesalers List */}
      {wholesalers.length > 0 && !selectedWholesaler && (
        <>
          <h2 className="text-2xl font-bold mb-4">Wholesalers in {pinCode}</h2>
          <div className="space-y-4 mb-8">
            {wholesalers.map((wholesaler) => (
              <Card key={wholesaler.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={`/abstract-geometric-shapes.png?height=64&width=64&query=${wholesaler.business_name}`}
                            alt={wholesaler.business_name || wholesaler.name}
                          />
                          <AvatarFallback>{(wholesaler.business_name || wholesaler.name).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{wholesaler.business_name || wholesaler.name}</h3>
                          {wholesaler.name && wholesaler.business_name && (
                            <p className="text-gray-500">{wholesaler.name}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-gray-500 mr-4">
                              {wholesaler.distance ? `${wholesaler.distance} km away` : ""}
                            </span>
                            <Badge variant="outline">PIN: {wholesaler.pin_code}</Badge>
                          </div>
                          {wholesaler.rating && (
                            <div className="mt-2">
                              <Badge className="bg-yellow-500">{wholesaler.rating} ★</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 flex items-center justify-center">
                      <Button
                        className="h-14 px-6 bg-blue-500 hover:bg-blue-600"
                        onClick={() => handleSelectWholesaler(wholesaler)}
                      >
                        View Catalog
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Products List */}
      {selectedWholesaler && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Products from {selectedWholesaler.business_name || selectedWholesaler.name}
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWholesaler(null)
                setProducts([])
              }}
            >
              Back to Wholesalers
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
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
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="h-12 min-w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sort by</SelectLabel>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery ? "No products match your search" : "No products available from this wholesaler"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {filteredProducts.map((product) => {
                const quantity = getItemQuantity(product.id)
                return (
                  <Card key={product.id} className="overflow-hidden">
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
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-semibold mb-1">{product.name}</h3>
                      <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                        </div>
                        {quantity === 0 ? (
                          <Button onClick={() => handleAddToCart(product)} className="bg-blue-500 hover:bg-blue-600">
                            Add to Cart
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
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
