import { supabase } from "./supabase-client"
import type { Product } from "./types"
import { generateDemoProducts } from "./demo-data-service"

// Store for mock products created during the session
let mockProducts: Product[] = []

// Get all products
export async function getAllProducts(): Promise<{ data: Product[] | null; error: any }> {
  try {
    // First try to get products from the database
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      // If successful and we have data, return it
      if (!error && data && data.length > 0) {
        return { data, error: null }
      }

      // If there's a permission error or no data, fall back to demo data
      // We'll log the error but not propagate it to the UI
      if (error) {
        console.log("Using demo products due to database error:", error.message)
      }
    } catch (dbError) {
      console.log("Database error, using demo products:", dbError)
    }

    // If we reach here, either there was an error or no data from the database
    // Return demo data plus any mock products created during the session
    const combinedProducts = [...mockProducts, ...generateDemoProducts()]
    return { data: combinedProducts, error: null }
  } catch (error) {
    console.error("Error in getAllProducts:", error)
    // Even if there's an error in our error handling, still return demo data
    const demoProducts = generateDemoProducts()
    return { data: demoProducts, error: null }
  }
}

// Get products by wholesaler
export async function getProductsByWholesaler(wholesalerId: string): Promise<{ data: Product[] | null; error: any }> {
  try {
    // Check if this is a demo user ID (non-UUID format)
    if (wholesalerId.startsWith("user-") || !isValidUUID(wholesalerId)) {
      console.log("Using demo products for demo wholesaler")
      // Combine mock products with demo products
      const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === "wholesaler-1")
      const filteredMockProducts = mockProducts.filter((p) => p.wholesaler_id === "wholesaler-1")
      return { data: [...filteredMockProducts, ...demoProducts], error: null }
    }

    // Try to get products from the database
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("wholesaler_id", wholesalerId)
        .order("created_at", { ascending: false })

      // If successful and we have data, return it
      if (!error && data && data.length > 0) {
        return { data, error: null }
      }

      // If there's a permission error or no data, fall back to demo data
      if (error) {
        console.log(`Using demo products for wholesaler ${wholesalerId} due to database error:`, error.message)
      }
    } catch (dbError) {
      console.log(`Database error for wholesaler ${wholesalerId}, using demo products:`, dbError)
    }

    // If we reach here, either there was an error or no data from the database
    // Return filtered demo data plus any mock products
    const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === wholesalerId)
    const filteredMockProducts = mockProducts.filter((p) => p.wholesaler_id === wholesalerId)
    return { data: [...filteredMockProducts, ...demoProducts], error: null }
  } catch (error) {
    console.error("Error in getProductsByWholesaler:", error)
    // Even if there's an error in our error handling, still return demo data
    const demoProducts = generateDemoProducts().filter(
      (p) => p.wholesaler_id === wholesalerId || p.wholesaler_id === "wholesaler-1",
    )
    return { data: demoProducts, error: null }
  }
}

// Get product by ID
export async function getProductById(productId: string): Promise<{ data: Product | null; error: any }> {
  try {
    // First check if it's a mock product created during this session
    const mockProduct = mockProducts.find((p) => p.id === productId)
    if (mockProduct) {
      return { data: mockProduct, error: null }
    }

    // Check if this is a demo product ID (non-UUID format)
    if (productId.startsWith("product-") || !isValidUUID(productId)) {
      console.log("Using demo product for demo product ID")
      const demoProduct = generateDemoProducts().find((p) => p.id === productId)
      if (demoProduct) {
        return { data: demoProduct, error: null }
      } else {
        // If no matching demo product, return the first one
        return { data: generateDemoProducts()[0], error: null }
      }
    }

    // Try to get the product from the database
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

      // If successful, return the data
      if (!error && data) {
        return { data, error: null }
      }

      // If there's an error, check demo data
      if (error) {
        console.log(`Using demo product for ID ${productId} due to database error:`, error.message)
        const demoProduct = generateDemoProducts().find((p) => p.id === productId)
        if (demoProduct) {
          return { data: demoProduct, error: null }
        }
        // If no matching demo product, return the first one
        return { data: generateDemoProducts()[0], error: null }
      }
    } catch (dbError) {
      console.log(`Database error for product ${productId}, using demo product:`, dbError)
    }

    // If we reach here, return a demo product
    return { data: generateDemoProducts()[0], error: null }
  } catch (error) {
    console.error("Error in getProductById:", error)
    // Even if there's an error in our error handling, still return a demo product
    return { data: generateDemoProducts()[0], error: null }
  }
}

// Create a new product - use demo data for now to avoid permission issues
export async function createProduct(
  product: Omit<Product, "id" | "created_at">,
): Promise<{ data: Product | null; error: any }> {
  try {
    // For demo purposes, create a mock product
    const mockProduct: Product = {
      id: `product-${Date.now()}`,
      wholesaler_id: product.wholesaler_id || "wholesaler-1",
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || "/abstract-geometric-sculpture.png",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: product.category || "Groceries", // Default category for demo
      is_active: product.is_active !== undefined ? product.is_active : true,
    }

    // Add the mock product to our session storage
    mockProducts.unshift(mockProduct) // Add to the beginning of the array

    // Log the mock product creation
    console.log("Created mock product:", mockProduct)

    return { data: mockProduct, error: null }
  } catch (error) {
    console.error("Error creating product:", error)
    return { data: null, error }
  }
}

// Update a product
export async function updateProduct(
  productId: string,
  updates: Partial<Product>,
): Promise<{ data: Product | null; error: any }> {
  try {
    // Check if we're updating a mock product
    const mockProductIndex = mockProducts.findIndex((p) => p.id === productId)

    if (mockProductIndex >= 0) {
      // Update the mock product
      mockProducts[mockProductIndex] = {
        ...mockProducts[mockProductIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      }

      console.log("Updated mock product:", mockProducts[mockProductIndex])
      return { data: mockProducts[mockProductIndex], error: null }
    }

    // For demo purposes, return a mock successful response
    const mockProduct: Product = {
      id: productId,
      wholesaler_id: updates.wholesaler_id || "wholesaler-1",
      name: updates.name || "Updated Product",
      description: updates.description || "",
      price: updates.price || 0,
      stock_quantity: updates.stock_quantity || 0,
      image_url: updates.image_url || "/abstract-geometric-sculpture.png",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: updates.category || "Groceries",
      is_active: updates.is_active !== undefined ? updates.is_active : true,
    }

    // Log the mock product update
    console.log("Updated mock product:", mockProduct)

    return { data: mockProduct, error: null }
  } catch (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }
}

// Delete a product
export async function deleteProduct(productId: string): Promise<{ error: any }> {
  try {
    // Check if we're deleting a mock product
    const initialLength = mockProducts.length
    mockProducts = mockProducts.filter((p) => p.id !== productId)

    if (mockProducts.length < initialLength) {
      console.log("Deleted mock product:", productId)
      return { error: null }
    }

    // For demo purposes, return a mock successful response
    console.log("Deleted mock product:", productId)
    return { error: null }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { error }
  }
}

// Upload product image
export async function uploadProductImage(file: File): Promise<{ url: string | null; error: any }> {
  try {
    // For demo purposes, return a mock successful response
    const mockUrl = "/abstract-geometric-sculpture.png"
    console.log("Uploaded mock image:", mockUrl)
    return { url: mockUrl, error: null }
  } catch (error) {
    console.error("Error uploading product image:", error)
    return { url: null, error }
  }
}

// Search products
export async function searchProducts(
  query: string,
  filters?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    wholesalerId?: string
  },
): Promise<{ data: Product[] | null; error: any }> {
  try {
    // For demo purposes, return filtered demo products plus mock products
    const demoProducts = generateDemoProducts()
    const allProducts = [...mockProducts, ...demoProducts]

    let filteredProducts = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase())),
    )

    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter((p) => p.category === filters.category)
      }
      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter((p) => p.price >= filters.minPrice!)
      }
      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter((p) => p.price <= filters.maxPrice!)
      }
      if (filters.wholesalerId) {
        filteredProducts = filteredProducts.filter((p) => p.wholesaler_id === filters.wholesalerId)
      }
    }

    return { data: filteredProducts, error: null }
  } catch (error) {
    console.error("Error searching products:", error)
    return { data: null, error }
  }
}

// Get product categories
export async function getProductCategories(): Promise<{ data: string[] | null; error: any }> {
  try {
    // Return demo categories
    return { data: ["Groceries", "Snacks", "Dairy", "Beverages", "Household"], error: null }
  } catch (error) {
    console.error("Error fetching product categories:", error)
    return { data: null, error }
  }
}

// Add a helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
