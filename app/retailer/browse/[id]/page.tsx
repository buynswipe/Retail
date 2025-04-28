"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { ProductReviews } from "@/app/components/product/product-reviews"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getProductById } from "@/lib/product-service"
import { formatCurrency } from "@/lib/utils"
import { ShoppingCart, Star, Truck, Package, Store, ArrowLeft, Plus, Minus, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useCart()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getProductById(productId)
        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error("Failed to load product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      product,
      quantity,
    })

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold mb-4">{t("Product Not Found")}</h1>
              <p className="text-gray-500 mb-6">
                {t("The product you are looking for does not exist or has been removed.")}
              </p>
              <Button asChild>
                <Link href="/retailer/browse">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("Back to Products")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <Button variant="outline" asChild className="mb-2">
              <Link href="/retailer/browse">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("Back to Products")}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden border">
              <div className="relative aspect-square">
                {product.image_url ? (
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (product.average_rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {product.average_rating ? product.average_rating.toFixed(1) : "0"} ({product.review_count || 0}{" "}
                  {t("reviews")})
                </span>
              </div>

              <div className="flex items-center mb-6">
                <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="ml-2 text-gray-500 line-through">{formatCurrency(product.mrp)}</span>
                    <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% {t("OFF")}
                    </Badge>
                  </>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Badge variant={product.stock_status === "in_stock" ? "default" : "destructive"} className="mr-2">
                    {product.stock_status === "in_stock" ? t("In Stock") : t("Out of Stock")}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {product.unit} • {t("Product Code")}: {product.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Store className="h-4 w-4 mr-1" />
                  {t("Sold by")}: {product.wholesaler_name || t("Unknown Seller")}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-16 text-center border-0"
                    />
                    <Button variant="ghost" size="icon" onClick={incrementQuantity}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock_status !== "in_stock"}
                  className="w-full md:w-auto"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {t("Add to Cart")}
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <Truck className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("Fast Delivery")}</p>
                    <p className="text-gray-500">{t("Delivery within 24-48 hours")}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("Quality Guarantee")}</p>
                    <p className="text-gray-500">{t("100% original products")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Tabs */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  {t("Description")}
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  {t("Specifications")}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  {t("Reviews")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-6">
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p className="text-gray-500">{t("No description available for this product.")}</p>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div>
                  {product.specifications ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex border-b pb-2">
                          <span className="font-medium w-1/3">{key}</span>
                          <span className="w-2/3">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">{t("No specifications available for this product.")}</p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && <ProductReviews productId={product.id} productName={product.name} />}
            </div>
          </div>

          {/* Related Products */}
          {product.related_products && product.related_products.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">{t("Related Products")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.related_products.map((relatedProduct) => (
                  <Card key={relatedProduct.id} className="overflow-hidden">
                    <Link href={`/retailer/browse/${relatedProduct.id}`}>
                      <div className="aspect-square relative bg-gray-100">
                        {relatedProduct.image_url ? (
                          <Image
                            src={relatedProduct.image_url || "/placeholder.svg"}
                            alt={relatedProduct.name}
                            fill
                            className="object-contain p-4"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 mb-1">{relatedProduct.name}</h3>
                        <p className="font-bold">{formatCurrency(relatedProduct.price)}</p>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
