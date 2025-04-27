import { supabase } from "./supabase-client"
import type { Product } from "./supabase-client"

/**
 * Get all products
 */
export async function getProducts(options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Products")
      .select("*, Categories(*)", { count: "exact" })
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Alias for getProducts
 */
export async function getAllProducts(options = { limit: 50, offset: 0 }) {
  return getProducts(options)
}

/**
 * Get products by wholesaler
 */
export async function getProductsByWholesaler(wholesalerId: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Products")
      .select("*, Categories(*)", { count: "exact" })
      .eq("wholesaler_id", wholesalerId)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error fetching wholesaler products:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Get a product by ID
 */
export async function getProductById(productId: string) {
  try {
    const { data, error } = await supabase.from("Products").select("*, Categories(*)").eq("id", productId).single()

    return { data, error }
  } catch (error) {
    console.error("Error fetching product:", error)
    return { data: null, error }
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, "id" | "created_at">) {
  try {
    const { data, error } = await supabase.from("Products").insert(product).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error creating product:", error)
    return { data: null, error }
  }
}

/**
 * Update a product
 */
export async function updateProduct(productId: string, updates: Partial<Product>) {
  try {
    const { data, error } = await supabase.from("Products").update(updates).eq("id", productId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase.from("Products").delete().eq("id", productId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { success: false, error }
  }
}

/**
 * Search products
 */
export async function searchProducts(query: string, options = { limit: 50, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from("Products")
      .select("*, Categories(*)", { count: "exact" })
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .range(options.offset, options.offset + options.limit - 1)
      .order("created_at", { ascending: false })

    return { data, error, count }
  } catch (error) {
    console.error("Error searching products:", error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Upload a product image
 */
export async function uploadProductImage(file: File, wholesalerId: string) {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${wholesalerId}/${Date.now()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(filePath)

    return {
      data: {
        path: filePath,
        url: publicUrl,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error uploading product image:", error)
    return { data: null, error }
  }
}

/**
 * Get product categories
 */
export async function getProductCategories() {
  try {
    const { data, error } = await supabase.from("Categories").select("*").order("name", { ascending: true })

    return { data, error }
  } catch (error) {
    console.error("Error fetching product categories:", error)
    return { data: null, error }
  }
}
