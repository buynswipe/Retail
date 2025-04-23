import { supabase } from "./supabase-client"
import type { Product } from "./supabase-client"

// Get all products
export async function getAllProducts(options?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: "price" | "name" | "created_at"
  sortOrder?: "asc" | "desc"
}) {
  try {
    let query = supabase.from("products").select("*, wholesaler:wholesaler_id(*)")

    // Apply filters
    if (options?.category) {
      query = query.eq("category", options.category)
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`)
    }

    if (options?.minPrice !== undefined) {
      query = query.gte("price", options.minPrice)
    }

    if (options?.maxPrice !== undefined) {
      query = query.lte("price", options.maxPrice)
    }

    // Apply sorting
    if (options?.sortBy) {
      query = query.order(options.sortBy, { ascending: options?.sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

// Alias for getAllProducts
export const getProducts = getAllProducts

// Get product by ID
export async function getProductById(productId: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, wholesaler:wholesaler_id(*)")
      .eq("id", productId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

// Create a new product
export async function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase.from("products").insert([product]).select()

    if (error) throw error
    return data?.[0] as Product
  } catch (error) {
    console.error("Error creating product:", error)
    return null
  }
}

// Update a product
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "updated_at">>,
) {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select()

    if (error) throw error
    return data?.[0] as Product
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

// Delete a product
export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

// Update product stock
export async function updateProductStock(productId: string, quantity: number) {
  try {
    const { data, error } = await supabase.rpc("update_product_stock", {
      p_product_id: productId,
      p_quantity: quantity,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating product stock:", error)
    return false
  }
}

// Get products by wholesaler
export async function getProductsByWholesaler(
  wholesalerId: string,
  options?: {
    limit?: number
    offset?: number
    category?: string
    search?: string
    sortBy?: "price" | "name" | "created_at" | "stock_quantity"
    sortOrder?: "asc" | "desc"
  },
) {
  try {
    let query = supabase.from("products").select("*").eq("wholesaler_id", wholesalerId).eq("is_active", true)

    // Apply filters
    if (options?.category) {
      query = query.eq("category", options.category)
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`)
    }

    // Apply sorting
    if (options?.sortBy) {
      query = query.order(options.sortBy, { ascending: options?.sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Product[]
  } catch (error) {
    console.error("Error fetching wholesaler products:", error)
    return []
  }
}

// Upload product image
export async function uploadProductImage(file: File, wholesalerId: string) {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${wholesalerId}/${Date.now()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error: uploadError } = await supabase.storage.from("products").upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from("products").getPublicUrl(filePath)

    return {
      success: true,
      url: data.publicUrl,
    }
  } catch (error) {
    console.error("Error uploading product image:", error)
    return {
      success: false,
      error: "Failed to upload image",
    }
  }
}
