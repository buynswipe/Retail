import type { Product } from "./types"

export interface SearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest" | "default"
  wholesalerId?: string
}

// Filter products based on search query and filters
export function filterProducts(products: Product[], filters: SearchFilters): Product[] {
  if (!products || !Array.isArray(products)) {
    return []
  }

  let filteredProducts = [...products]

  // Apply search query
  if (filters.query) {
    const query = filters.query.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)),
    )
  }

  // Apply category filter
  if (filters.category && filters.category !== "all") {
    filteredProducts = filteredProducts.filter((product) => product.category === filters.category)
  }

  // Apply price range filter
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price >= filters.minPrice!)
  }

  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price <= filters.maxPrice!)
  }

  // Apply wholesaler filter
  if (filters.wholesalerId) {
    filteredProducts = filteredProducts.filter((product) => product.wholesaler_id === filters.wholesalerId)
  }

  // Apply sorting
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
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA
        })
        break
      default:
        // Default sorting (no change)
        break
    }
  }

  return filteredProducts
}

// Get unique categories from products
export function getUniqueCategories(products: Product[]): string[] {
  if (!products || !Array.isArray(products)) {
    return []
  }

  const categories = new Set<string>()

  products.forEach((product) => {
    if (product.category) {
      categories.add(product.category)
    }
  })

  return Array.from(categories).sort()
}

// Get price range from products
export function getPriceRange(products: Product[]): { min: number; max: number } {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return { min: 0, max: 5000 } // Default range
  }

  let min = Number.MAX_VALUE
  let max = 0

  products.forEach((product) => {
    if (product.price < min) min = product.price
    if (product.price > max) max = product.price
  })

  // Add a small buffer to the max price
  max = Math.ceil(max * 1.1)

  // If min and max are the same, create a range
  if (min === max) {
    min = Math.max(0, min - 100)
    max = max + 100
  }

  return { min, max }
}
