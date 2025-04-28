import type { Product } from "./types"

export interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  wholesalerId?: string
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest"
  query?: string
}

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

export function getUniqueCategories(products: Product[]): string[] {
  const categories = new Set<string>()
  products.forEach((product) => {
    if (product.category) {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
}

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
