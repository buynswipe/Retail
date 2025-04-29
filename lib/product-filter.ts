import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { Product } from "./types"

// Types for filter options
export interface FilterOptions {
  categories?: string[]
  minPrice?: number
  maxPrice?: number
  wholesalerIds?: string[]
  inStock?: boolean
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest"
  page?: number
  limit?: number
}

/**
 * Filter products based on various criteria
 * @param options Filter options
 * @returns Promise with filtered products
 */
export async function filterProducts(options: FilterOptions = {}): Promise<{
  products: Product[]
  total: number
  page: number
  totalPages: number
}> {
  try {
    const { categories, minPrice, maxPrice, wholesalerIds, inStock, sortBy = "newest", page = 1, limit = 20 } = options

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Start building the query
    let query = supabase.from("products").select("*", { count: "exact" }).range(from, to)

    // Apply filters
    if (categories && categories.length > 0) {
      query = query.in("category", categories)
    }

    if (minPrice !== undefined) {
      query = query.gte("price", minPrice)
    }

    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice)
    }

    if (wholesalerIds && wholesalerIds.length > 0) {
      query = query.in("wholesaler_id", wholesalerIds)
    }

    if (inStock !== undefined) {
      query = query.eq("in_stock", inStock)
    }

    // Apply sorting
    switch (sortBy) {
      case "price_asc":
        query = query.order("price", { ascending: true })
        break
      case "price_desc":
        query = query.order("price", { ascending: false })
        break
      case "name_asc":
        query = query.order("name", { ascending: true })
        break
      case "name_desc":
        query = query.order("name", { ascending: false })
        break
      case "newest":
      default:
        query = query.order("created_at", { ascending: false })
        break
    }

    // Execute the query
    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      products: data as Product[],
      total: totalCount,
      page,
      totalPages,
    }
  } catch (error) {
    return errorHandler(error, "Error filtering products", {
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
    })
  }
}

/**
 * Get available filter options (categories, price ranges, etc.)
 * @returns Promise with filter options
 */
export async function getFilterOptions(): Promise<{
  categories: string[]
  priceRange: { min: number; max: number }
  wholesalers: { id: string; name: string }[]
}> {
  try {
    // Get unique categories
    const { data: categoryData, error: categoryError } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)

    if (categoryError) throw categoryError

    // Get price range
    const { data: priceData, error: priceError } = await supabase
      .from("products")
      .select("price")
      .order("price", { ascending: true })

    if (priceError) throw priceError

    // Get wholesalers
    const { data: wholesalerData, error: wholesalerError } = await supabase
      .from("users")
      .select("id, business_name")
      .eq("role", "wholesaler")

    if (wholesalerError) throw wholesalerError

    // Process the results
    const categories = [...new Set(categoryData.map((item) => item.category))]

    const prices = priceData.map((item) => item.price)
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }

    const wholesalers = wholesalerData.map((item) => ({
      id: item.id,
      name: item.business_name,
    }))

    return {
      categories,
      priceRange,
      wholesalers,
    }
  } catch (error) {
    return errorHandler(error, "Error getting filter options", {
      categories: [],
      priceRange: { min: 0, max: 1000 },
      wholesalers: [],
    })
  }
}
