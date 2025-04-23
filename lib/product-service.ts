import { supabase, type Product } from "./supabase-client"

// Get all products
export async function getAllProducts(options?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}) {
  let query = supabase.from("products").select("*, users!inner(name, business_name)").eq("is_active", true)

  if (options?.category) {
    query = query.eq("category", options.category)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%, description.ilike.%${options.search}%`)
  }

  if (options?.minPrice !== undefined) {
    query = query.gte("price", options.minPrice)
  }

  if (options?.maxPrice !== undefined) {
    query = query.lte("price", options.maxPrice)
  }

  if (options?.sortBy) {
    query = query.order(options.sortBy, { ascending: options.sortOrder === "asc" })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching products:", error)
    throw new Error("Failed to fetch products")
  }

  return data
}

// Alias for getAllProducts to match the required export
export const getProducts = getAllProducts

// Get products by wholesaler ID
export async function getProductsByWholesaler(wholesalerId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("wholesaler_id", wholesalerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wholesaler products:", error)
    throw new Error("Failed to fetch wholesaler products")
  }

  return data
}

// Get a specific product
export async function getProduct(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, users!inner(name, business_name)")
    .eq("id", productId)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    throw new Error("Failed to fetch product")
  }

  return data
}

// Create a new product
export async function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("products").insert(product)

  if (error) {
    console.error("Error creating product:", error)
    throw new Error("Failed to create product")
  }

  return { success: true }
}

// Update a product
export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", productId)

  if (error) {
    console.error("Error updating product:", error)
    throw new Error("Failed to update product")
  }

  return { success: true }
}

// Delete a product (soft delete by setting is_active to false)
export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", productId)

  if (error) {
    console.error("Error deleting product:", error)
    throw new Error("Failed to delete product")
  }

  return { success: true }
}

// Update product stock
export async function updateProductStock(productId: string, quantity: number) {
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
    .eq("id", productId)

  if (error) {
    console.error("Error updating product stock:", error)
    throw new Error("Failed to update product stock")
  }

  return { success: true }
}

// Upload product image
export async function uploadProductImage(file: File) {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading product image:", uploadError)
      throw new Error("Failed to upload product image")
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

    return { url: data.publicUrl }
  } catch (error) {
    console.error("Error in uploadProductImage:", error)
    throw new Error("Failed to upload product image")
  }
}
