"use server"

import { supabase } from "./supabase-client"
import type { ProductVariant } from "./types"

/**
 * Get all variants for a product
 * @param productId The ID of the product
 * @returns A promise that resolves to an array of product variants
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting product variants:", error)
    return []
  }
}

/**
 * Get a specific product variant by ID
 * @param variantId The ID of the variant
 * @returns A promise that resolves to the product variant or null if not found
 */
export async function getProductVariantById(variantId: string): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase.from("product_variants").select("*").eq("id", variantId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error getting product variant:", error)
    return null
  }
}

/**
 * Create a new product variant
 * @param variant The product variant to create
 * @returns A promise that resolves to the created product variant
 */
export async function createProductVariant(
  variant: Omit<ProductVariant, "id" | "created_at">,
): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        ...variant,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating product variant:", error)
    return null
  }
}

/**
 * Update an existing product variant
 * @param variantId The ID of the variant to update
 * @param updates The updates to apply to the variant
 * @returns A promise that resolves to the updated product variant
 */
export async function updateProductVariant(
  variantId: string,
  updates: Partial<Omit<ProductVariant, "id" | "created_at">>,
): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", variantId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating product variant:", error)
    return null
  }
}

/**
 * Delete a product variant
 * @param variantId The ID of the variant to delete
 * @returns A promise that resolves to true if successful, false otherwise
 */
export async function deleteProductVariant(variantId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("product_variants").delete().eq("id", variantId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting product variant:", error)
    return false
  }
}

/**
 * Update variant stock quantity
 * @param variantId The ID of the variant
 * @param quantity The new stock quantity
 * @returns A promise that resolves to the updated product variant
 */
export async function updateVariantStock(variantId: string, quantity: number): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .update({
        stock_quantity: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", variantId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating variant stock:", error)
    return null
  }
}
