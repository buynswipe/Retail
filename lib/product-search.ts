import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { Product } from "./types"

// Constants for search configuration
const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2
const MAX_RESULTS = 50

export interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  wholesalerId?: string
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest"
  query?: string
}

// Debounce function to prevent excessive API calls
let debounceTimeout: NodeJS.Timeout
export const debounceSearch = (callback: Function, delay: number = SEARCH_DEBOUNCE_MS) => {
  return (...args: any[]) => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => callback(...args), delay)
  }
}

/**
 * Search products by name, description, or category
 * @param query Search query string
 * @param filters Optional filters to apply (category, price range, etc.)
 * @returns Promise with search results
 */
export async function searchProducts(
  query: string,
  filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    wholesalerId?: string
    inStock?: boolean
  } = {},
): Promise<Product[]> {
  try {
    // Validate input
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      return []
    }

    // Start building the query
    let queryBuilder = supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(MAX_RESULTS)

    // Apply filters if provided
    if (filters.category) {
      queryBuilder = queryBuilder.eq("category", filters.category)
    }

    if (filters.minPrice !== undefined) {
      queryBuilder = queryBuilder.gte("price", filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte("price", filters.maxPrice)
    }

    if (filters.wholesalerId) {
      queryBuilder = queryBuilder.eq("wholesaler_id", filters.wholesalerId)
    }

    if (filters.inStock !== undefined) {
      queryBuilder = queryBuilder.eq("in_stock", filters.inStock)
    }

    // Execute the query
    const { data, error } = await queryBuilder

    if (error) {
      throw error
    }

    return data as Product[]
  } catch (error) {
    return errorHandler(error, "Error searching products", [])
  }
}

/**
 * Filter products based on various criteria
 * @param products Array of products to filter
 * @param filters Filter criteria
 * @returns Filtered array of products
 */
export function filterProducts(products: Product[], filters: SearchFilters): Product[] {
  let filteredProducts = [...products]

  // Filter by search query
  if (filters.query && filters.query.trim() !== "") {
    const query = filters.query.toLowerCase().trim()
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)),
    )
  }

  // Filter by category
  if (filters.category && filters.category !== "all") {
    filteredProducts = filteredProducts.filter((product) => product.category === filters.category)
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price <= filters.maxPrice!)
  }

  // Filter by wholesaler
  if (filters.wholesalerId) {
    filteredProducts = filteredProducts.filter((product) => product.wholesaler_id === filters.wholesalerId)
  }

  // Sort products
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price)
        break
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "newest":
        filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
  }

  return filteredProducts
}

/**
 * Get unique categories from a list of products
 * @param products Array of products
 * @returns Array of unique category names
 */
export function getUniqueCategories(products: Product[]): string[] {
  const categories = new Set<string>()
  products.forEach((product) => {
    if (product.category) {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
}

/**
 * Get price range from a list of products
 * @param products Array of products
 * @returns Object with min and max price
 */
export function getPriceRange(products: Product[]): { min: number; max: number } {
  if (products.length === 0) {
    return { min: 0, max: 0 }
  }

  let min = products[0].price
  let max = products[0].price

  products.forEach((product) => {
    if (product.price < min) min = product.price
    if (product.price > max) max = product.price
  })

  return { min, max }
}

/**
 * Get product suggestions based on partial input
 * @param partialInput Partial search input
 * @returns Promise with suggestion results
 */
export async function getProductSuggestions(partialInput: string): Promise<string[]> {
  try {
    if (!partialInput || partialInput.length < MIN_SEARCH_LENGTH) {
      return []
    }

    const { data, error } = await supabase.from("products").select("name").ilike("name", `%${partialInput}%`).limit(10)

    if (error) {
      throw error
    }

    // Extract unique names and return
    return [...new Set(data.map((item) => item.name))]
  } catch (error) {
    return errorHandler(error, "Error getting product suggestions", [])
  }
}

/**
 * Index a product for search (useful after product creation/update)
 * @param product Product to index
 */
export async function indexProduct(product: Product): Promise<void> {
  try {
    // In a real implementation, this might update a search index
    // For now, we're just ensuring the product exists in the database
    const { error } = await supabase.from("products").upsert({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      search_vector: `${product.name} ${product.description} ${product.category}`.toLowerCase(),
    })

    if (error) {
      throw error
    }
  } catch (error) {
    errorHandler(error, "Error indexing product")
  }
}
