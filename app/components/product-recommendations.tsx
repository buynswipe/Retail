"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getRecommendedProducts, getSimilarProducts } from "@/lib/recommendation-service"
import type { Product } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"

interface ProductRecommendationsProps {
  type: "recommended" | "similar"
  productId?: string
  limit?: number
}

export default function ProductRecommendations({ type, productId, limit = 4 }: ProductRecommendationsProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        let fetchedProducts: Product[] = []

        if (type === "recommended" && user) {
          fetchedProducts = await getRecommendedProducts(user.id, limit)
        } else if (type === "similar" && productId) {
          fetchedProducts = await getSimilarProducts(productId, limit)
        }

        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching product recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [type, productId, user, limit])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(limit)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="my-6">
      <h2 className="text-xl font-semibold mb-4">
        {type === "recommended" ? "Recommended For You" : "Similar Products"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link href={`/retailer/browse/${product.id}`} key={product.id} className="no-underline">
            <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full">
                <Image src={product.image_url || "/placeholder.png"} alt={product.name} fill className="object-cover" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">₹{product.price.toFixed(2)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
