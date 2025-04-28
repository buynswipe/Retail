import { supabase } from "./supabase-client"
import type { Product } from "./types"
import { generateDemoProducts } from "./demo-data-service"

// Get all products
export async function getAllProducts(): Promise<{ data: Product[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return { data: null, error }
    }

    // If no data from Supabase, use demo data
    if (!data || data.length === 0) {
      return { data: generateDemoProducts(), error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { data: null, error }
  }
}

// Get products by wholesaler
export async function getProductsByWholesaler(wholesalerId: string): Promise<{ data: Product[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("wholesaler_id", wholesalerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products by wholesaler:", error)
      return { data: null, error }
    }

    // If no data from Supabase, use filtered demo data
    if (!data || data.length === 0) {
      const demoProducts = generateDemoProducts().filter((p) => p.wholesaler_id === wholesalerId)
      return { data: demoProducts, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching products by wholesaler:", error)
    return { data: null, error }
  }
}

// Get product by ID
export async function getProductById(productId: string): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

    if (error) {
      console.error("Error fetching product by ID:", error)

      // If not found in Supabase, check demo data
      if (error.code === "PGRST116") {
        const demoProduct = generateDemoProducts().find((p) => p.id === productId)
        if (demoProduct) {
          return { data: demoProduct, error: null }
        }
      }

      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching product by ID:", error)
    return { data: null, error }
  }
}

// Create a new product
export async function createProduct(
  product: Omit<Product, "id" | "created_at">,
): Promise<{ data: Product | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return { data: null, error }
    }

    return { data, error: null }
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
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error updating product:", error)
    return { data: null, error }
  }
}

// Delete a product
export async function deleteProduct(productId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("Error deleting product:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { error }
  }
}

// Upload product image
export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<{ data: { path: string; url: string } | null; error: any }> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${productId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading product image:", error)
      return { data: null, error }
    }

    // Get the public URL for the uploaded file
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
