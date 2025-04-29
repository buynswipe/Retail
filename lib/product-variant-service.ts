import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { ProductVariant } from "./types"

/**
 * Get all variants for a product
 * @param productId Product ID to get variants for
 * @returns Promise with product variants
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("price", { ascending: true })

    if (error) {
      throw error
    }

    return data as ProductVariant[]
  } catch (error) {
    return errorHandler(error, "Error getting product variants", [])
  }
}

/**
 * Create a new product variant
 * @param variant Product variant to create
 * @returns Promise with created variant
 */
export async function createProductVariant(variant: Omit<ProductVariant, "id">): Promise<ProductVariant> {
  try {
    const { data, error } = await supabase.from("product_variants").insert(variant).select().single()

    if (error) {
      throw error
    }

    return data as ProductVariant
  } catch (error) {
    return errorHandler(error, "Error creating product variant", {} as ProductVariant)
  }
}

/**
 * Update a product variant
 * @param id Variant ID to update
 * @param updates Updates to apply
 * @returns Promise with updated variant
 */
export async function updateProductVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
  try {
    const { data, error } = await supabase.from("product_variants").update(updates).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return data as ProductVariant
  } catch (error) {
    return errorHandler(error, "Error updating product variant", {} as ProductVariant)
  }
}

/**
 * Delete a product variant
 * @param id Variant ID to delete
 * @returns Promise with success status
 */
export async function deleteProductVariant(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("product_variants").delete().eq("id", id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    return errorHandler(error, "Error deleting product variant", false)
  }
}

/**
 * Get default variant for a product
 * @param productId Product ID to get default variant for
 * @returns Promise with default variant
 */
export async function getDefaultVariant(productId: string): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_default", true)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        // If no default variant, get the first one
        const { data: firstVariant, error: firstError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .order("price", { ascending: true })
          .limit(1)
          .single()

        if (firstError) {
          return null
        }

        return firstVariant as ProductVariant
      }
      throw error
    }

    return data as ProductVariant
  } catch (error) {
    return errorHandler(error, "Error getting default variant", null)
  }
}
