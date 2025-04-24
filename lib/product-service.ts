import { supabase } from "@/lib/supabase-client"
import type { Product } from "@/lib/supabase-client"

// Get products with optional filters
export async function getProducts(
  wholesalerId?: string,
  category?: string,
  inStock?: boolean,
): Promise<{ data: Product[] | null; error: any }> {
  try {
    let query = supabase.from("products").select(`
      *,
      wholesaler:users!wholesaler_id(id, name, business_name)
    `)

    // Apply filters if provided
    if (wholesalerId) {
      query = query.eq("wholesaler_id", wholesalerId)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (inStock) {
      query = query.gt("stock_quantity", 0)
    }

    // Only get active products
    query = query.eq("is_active", true)

    // Order by creation date
    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    // Transform data to include wholesaler name
    const transformedData = data?.map((product) => ({
      ...product,
      wholesaler_name: product.wholesaler?.business_name || product.wholesaler?.name,
    }))

    return { data: transformedData || null, error }
  } catch (error) {
    console.error("Error getting products:", error)
    return { data: null, error }
  }
}

// Get products by wholesaler ID
export async function getProductsByWholesaler(wholesalerId: string): Promise<{ data: Product[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("wholesaler_id", wholesalerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting products:", error)
    return { data: null, error }
  }
}

// Get all active products
export async function getAllProducts(): Promise<{ data: Product[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting products:", error)
    return { data: null, error }
  }
}

// Get product by ID
export async function getProductById(productId: string): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

    return { data, error }
  } catch (error) {
    console.error("Error getting product:", error)
    return { data: null, error }
  }
}

// Create a new product
export async function createProduct(
  wholesalerId: string,
  product: Omit<Product, "id" | "wholesaler_id" | "created_at" | "updated_at" | "is_active">,
): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        wholesaler_id: wholesalerId,
        is_active: true,
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating product:", error)
    return { data: null, error }
  }
}

// Update an existing product
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "wholesaler_id" | "created_at" | "updated_at">>,
): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase.from("products").update(updates).eq("id", productId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }
}

// Delete a product (soft delete)
export async function deleteProduct(productId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { success: false, error }
  }
}

// Upload product image
export async function uploadProductImage(file: File): Promise<{ url: string | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error } = await supabase.storage.from("product-images").upload(filePath, file)

    if (error) {
      return { url: null, error }
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
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
    let dbQuery = supabase.from("products").select("*").eq("is_active", true).ilike("name", `%${query}%`)

    if (filters?.category) {
      dbQuery = dbQuery.eq("category", filters.category)
    }

    if (filters?.minPrice !== undefined) {
      dbQuery = dbQuery.gte("price", filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      dbQuery = dbQuery.lte("price", filters.maxPrice)
    }

    if (filters?.wholesalerId) {
      dbQuery = dbQuery.eq("wholesaler_id", filters.wholesalerId)
    }

    const { data, error } = await dbQuery.order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error searching products:", error)
    return { data: null, error }
  }
}
