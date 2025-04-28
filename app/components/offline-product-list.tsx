"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WifiOff, ShoppingCart, Package } from "lucide-react"
import indexedDBService from "@/lib/indexed-db"
import { useCart } from "@/lib/cart-context"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  image_url?: string
  _offline?: boolean
}

export function OfflineProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadOfflineProducts = async () => {
      try {
        const data = await indexedDBService.getOfflineData("products:all")
        if (data && Array.isArray(data)) {
          // Filter out deleted products and sort by name
          const filteredProducts = data
            .filter((product) => !product._deleted)
            .sort((a, b) => a.name.localeCompare(b.name))

          setProducts(filteredProducts)
        }
      } catch (error) {
        console.error("Error loading offline products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOfflineProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse flex flex-col items-center">
          <Package className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">Loading offline products...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <WifiOff className="h-5 w-5 mr-2 text-yellow-600" />
            Offline Mode
          </CardTitle>
          <CardDescription>No products available offline. Connect to the internet to browse products.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <WifiOff className="h-5 w-5 mr-2 text-yellow-600" />
        <h2 className="text-lg font-medium">Offline Mode - Cached Products</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className={product._offline ? "border-dashed border-yellow-400" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{product.name}</CardTitle>
                {product._offline && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Offline
                  </Badge>
                )}
              </div>
              <CardDescription>{product.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <p className="font-bold">₹{product.price.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
