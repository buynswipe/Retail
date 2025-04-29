"use server"

import { supabase } from "./supabase-client"
import type { Product, ProductFilter } from "./types"

/**
 * Filter products based on various criteria
 * @param filters The filter criteria
 * @param page The page number for pagination
 * @param pageSize The number of items per page
 * @returns A promise that resolves to an object containing the filtered products and total count
 */
export async function filterProducts(
  filters: ProductFilter,
  page = 1,
  pageSize = 10,
): Promise<{ products: Product[]; total: number }> {
  try {
    let query = supabase.from("products").select("*", { count: "exact" })

    // Apply filters
    if (filters.category) {
      query = query.eq("category", filters.category)
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice)
    }

    if (filters.inStock !== undefined) {
      query = query.eq("in_stock", filters.inStock)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.brands && filters.brands.length > 0) {
      query = query.in("brand", filters.brands)
    }

    // Apply sorting
    if (filters.sortBy) {
      const direction = filters.sortDirection === "desc" ? { ascending: false } : { ascending: true }
      query = query.order(filters.sortBy, direction)
    } else {
      // Default sorting
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      products: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Error filtering products:", error)
    return { products: [], total: 0 }
  }
}

/**
 * Get all available product categories
 * @returns A promise that resolves to an array of category names
 */
export async function getProductCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("products").select("category").order("category")

    if (error) throw error

    // Extract unique categories
    const categories = [...new Set(data?.map((item) => item.category))]
    return categories.filter(Boolean) as string[]
  } catch (error) {
    console.error("Error getting product categories:", error)
    return []
  }
}

/**
 * Get all available product brands
 * @returns A promise that resolves to an array of brand names
 */
export async function getProductBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("products").select("brand").order("brand")

    if (error) throw error

    // Extract unique brands
    const brands = [...new Set(data?.map((item) => item.brand))]
    return brands.filter(Boolean) as string[]
  } catch (error) {
    console.error("Error getting product brands:", error)
    return []
  }
}

/**
 * Get price range (min and max) for all products
 * @returns A promise that resolves to an object containing min and max prices
 */
export async function getProductPriceRange(): Promise<{ min: number; max: number }> {
  try {
    // Get min price
    const { data: minData, error: minError } = await supabase
      .from("products")
      .select("price")
      .order("price", { ascending: true })
      .limit(1)

    if (minError) throw minError

    // Get max price
    const { data: maxData, error: maxError } = await supabase
      .from("products")
      .select("price")
      .order("price", { ascending: false })
      .limit(1)

    if (maxError) throw maxError

    return {
      min: minData?.[0]?.price || 0,
      max: maxData?.[0]?.price || 1000,
    }
  } catch (error) {
    console.error("Error getting product price range:", error)
    return { min: 0, max: 1000 }
  }
}
