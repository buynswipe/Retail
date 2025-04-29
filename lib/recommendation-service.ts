"use server"

import { supabase } from "./supabase-client"
import type { Product, UserPreference } from "./types"
import { getProductById } from "./product-service"

/**
 * Get product recommendations based on user browsing history and purchase patterns
 * @param userId The ID of the user to get recommendations for
 * @param limit The maximum number of recommendations to return
 * @returns A promise that resolves to an array of recommended products
 */
export async function getRecommendedProducts(userId: string, limit = 5): Promise<Product[]> {
  try {
    // Get user's purchase history
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (orderError) throw orderError

    // Get user's browsing history
    const { data: browsingHistory, error: browsingError } = await supabase
      .from("product_views")
      .select("product_id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(10)

    if (browsingError) throw browsingError

    // Combine product IDs from both sources
    const productIds = [
      ...(orderItems?.map((item) => item.product_id) || []),
      ...(browsingHistory?.map((item) => item.product_id) || []),
    ]

    // If no history, return popular products
    if (productIds.length === 0) {
      return getPopularProducts(limit)
    }

    // Get categories of these products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("category")
      .in("id", productIds)

    if (productsError) throw productsError

    // Extract categories
    const categories = products?.map((p) => p.category) || []

    // Get recommendations based on these categories
    const { data: recommendations, error: recError } = await supabase
      .from("products")
      .select("*")
      .in("category", categories)
      .not("id", "in", productIds) // Exclude already purchased/viewed products
      .order("average_rating", { ascending: false })
      .limit(limit)

    if (recError) throw recError

    return recommendations || []
  } catch (error) {
    console.error("Error getting product recommendations:", error)
    // Fallback to popular products
    return getPopularProducts(limit)
  }
}

/**
 * Get popular products based on order frequency and ratings
 * @param limit The maximum number of products to return
 * @returns A promise that resolves to an array of popular products
 */
export async function getPopularProducts(limit = 5): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("order_count", { ascending: false })
      .order("average_rating", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting popular products:", error)
    return []
  }
}

/**
 * Get similar products based on category and attributes
 * @param productId The ID of the product to find similar products for
 * @param limit The maximum number of similar products to return
 * @returns A promise that resolves to an array of similar products
 */
export async function getSimilarProducts(productId: string, limit = 4): Promise<Product[]> {
  try {
    // Get the product details
    const product = await getProductById(productId)

    if (!product) {
      throw new Error("Product not found")
    }

    // Get products in the same category
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", product.category)
      .neq("id", productId) // Exclude the current product
      .order("average_rating", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting similar products:", error)
    return []
  }
}

/**
 * Save user preferences for recommendation engine
 * @param userId The ID of the user
 * @param preferences The user's preferences
 * @returns A promise that resolves when the preferences are saved
 */
export async function saveUserPreferences(userId: string, preferences: UserPreference): Promise<void> {
  try {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  } catch (error) {
    console.error("Error saving user preferences:", error)
    throw error
  }
}

/**
 * Track product view for recommendation engine
 * @param userId The ID of the user
 * @param productId The ID of the product viewed
 * @returns A promise that resolves when the view is tracked
 */
export async function trackProductView(userId: string, productId: string): Promise<void> {
  try {
    const { error } = await supabase.from("product_views").insert({
      user_id: userId,
      product_id: productId,
      viewed_at: new Date().toISOString(),
    })

    if (error) throw error
  } catch (error) {
    console.error("Error tracking product view:", error)
    // Don't throw here to prevent disrupting the user experience
  }
}
