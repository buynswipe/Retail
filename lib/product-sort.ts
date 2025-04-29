import type { Product } from "./types"

// Define sort options
export type SortOption = "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest" | "popularity"

/**
 * Sort products based on the specified criteria
 * @param products Array of products to sort
 * @param sortBy Sort criteria
 * @returns Sorted array of products
 */
export function sortProducts(products: Product[], sortBy: SortOption = "newest"): Product[] {
  if (!products || products.length === 0) {
    return []
  }

  const productsCopy = [...products]

  switch (sortBy) {
    case "price_asc":
      return productsCopy.sort((a, b) => a.price - b.price)

    case "price_desc":
      return productsCopy.sort((a, b) => b.price - a.price)

    case "name_asc":
      return productsCopy.sort((a, b) => a.name.localeCompare(b.name))

    case "name_desc":
      return productsCopy.sort((a, b) => b.name.localeCompare(a.name))

    case "popularity":
      // Sort by views or sales count if available
      return productsCopy.sort((a, b) => (b.views || 0) - (a.views || 0))

    case "newest":
    default:
      return productsCopy.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
  }
}

/**
 * Get available sort options with labels
 * @returns Array of sort options with labels
 */
export function getSortOptions(): { value: SortOption; label: string }[] {
  return [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
    { value: "popularity", label: "Popularity" },
  ]
}
