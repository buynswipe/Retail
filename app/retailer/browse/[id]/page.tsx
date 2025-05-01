"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { getProductById } from "@/lib/product-service"
import { ArrowLeft, Plus, Minus, ShoppingCart, Package, Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

function ProductDetailsContent() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addItem = () => {}, items = [], updateQuantity = () => {} } = useCart() || {}
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadProductDetails(id as string)
    }
  }, [id])

  useEffect(() => {
    // Check if product is already in cart
    if (product && items && Array.isArray(items)) {
      const cartItem = items.find((item) => item.product?.id === product.id)
      if (cartItem) {
        setQuantity(cartItem.quantity)
      } else {
        setQuantity(1)
      }
    }
  }, [product, items])

  const loadProductDetails = async (productId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await getProductById(productId)
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error("Product not found")
      }
      setProduct(data)
    } catch (error) {
      console.error("Error loading product details:", error)
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      })
      // Navigate back to browse after a short delay if product can't be loaded
      setTimeout(() => {
        router.push("/retailer/browse")
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addItem(product, quantity)
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleUpdateCart = () => {
    if (!product) return

    updateQuantity(product.id, quantity)
    toast({
      title: "Cart Updated",
      description: `${product.name} quantity updated in your cart.`,
    })
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const isInCart =
    product && items && Array.isArray(items) ? items.some((item) => item.product?.id === product.id) : false

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading product details...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/retailer/browse")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <Button variant="outline" onClick={() => router.push("/retailer/browse")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Browse
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain aspect-square"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center aspect-square">
              <Package className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-4">₹{product.price.toFixed(2)}</p>

          {product.stock_quantity > 0 ? (
            <Badge className="bg-green-500 mb-4">In Stock: {product.stock_quantity} available</Badge>
          ) : (
            <Badge className="bg-red-500 mb-4">Out of Stock</Badge>
          )}

          {product.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {product.stock_quantity > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-4 text-xl font-medium w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock_quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={isInCart ? handleUpdateCart : handleAddToCart}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isInCart ? "Update Cart" : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Product Details */}
          <div className="space-y-4">
            {product.category && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Category</span>
                <span>{product.category}</span>
              </div>
            )}
            {product.hsn_code && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">HSN Code</span>
                <span>{product.hsn_code}</span>
              </div>
            )}
            {product.gst_rate && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">GST Rate</span>
                <span>{product.gst_rate}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}

export default function ProductDetailsPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <ProductDetailsContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
