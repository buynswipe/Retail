import { supabase } from "./supabase-client"

export interface Product {
  id: string
  wholesaler_id: string
  name: string
  description?: string
  price: number
  stock_quantity: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductData {
  name: string
  description?: string
  price: number
  stock_quantity: number
  image_url?: string
}

export interface UpdateProductData {
  name?: string
  description?: string
  price?: number
  stock_quantity?: number
  image_url?: string
  is_active?: boolean
}

// Get products by wholesaler ID
export async function getProductsByWholesaler(wholesalerId: string): Promise<{ data: Product[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting products:", error)
    return { data: null, error }
  }
}

// Create a new product
export async function createProduct(
  wholesalerId: string,
  productData: CreateProductData,
): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        wholesaler_id: wholesalerId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock_quantity: productData.stock_quantity,
        image_url: productData.image_url,
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

// Update a product
export async function updateProduct(
  productId: string,
  productData: UpdateProductData,
): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase.from("products").update(productData).eq("id", productId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }
}

// Delete a product
export async function deleteProduct(productId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId)

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
    console.error("Error uploading image:", error)
    return { url: null, error }
  }
}
