import { supabase } from "./supabase-client"
import { errorHandler } from "./error-handler"
import type { Product } from "./types"

/**
 * Get product recommendations based on user's purchase history
 * @param userId User ID to get recommendations for
 * @param limit Maximum number of recommendations to return
 * @returns Promise with recommended products
 */
export async function getPersonalizedRecommendations(userId: string, limit = 10): Promise<Product[]> {
  try {
    // Get user's purchase history
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (orderError) throw orderError

    // If user has no purchase history, return popular products
    if (!orderItems || orderItems.length === 0) {
      return getPopularProducts(limit)
    }

    // Get categories of purchased products
    const productIds = orderItems.map((item) => item.product_id)

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("category")
      .in("id", productIds)

    if (productError) throw productError

    const categories = [...new Set(products.map((p) => p.category))]

    // Get recommendations based on categories
    const { data: recommendations, error: recError } = await supabase
      .from("products")
      .select("*")
      .in("category", categories)
      .not("id", "in", productIds) // Exclude already purchased products
      .eq("in_stock", true)
      .limit(limit)

    if (recError) throw recError

    return recommendations as Product[]
  } catch (error) {
    return errorHandler(error, "Error getting personalized recommendations", [])
  }
}

/**
 * Get popular products based on order frequency
 * @param limit Maximum number of products to return
 * @returns Promise with popular products
 */
export async function getPopularProducts(limit = 10): Promise<Product[]> {
  try {
    // This would ideally use a more sophisticated query with analytics
    // For now, we'll use a simple query to get products that appear in the most orders
    const { data, error } = await supabase.rpc("get_popular_products", { limit_count: limit })

    if (error) throw error

    return data as Product[]
  } catch (error) {
    return errorHandler(error, "Error getting popular products", [])
  }
}

/**
 * Get similar products to a given product
 * @param productId Product ID to find similar products for
 * @param limit Maximum number of similar products to return
 * @returns Promise with similar products
 */
export async function getSimilarProducts(productId: string, limit = 6): Promise<Product[]> {
  try {
    // Get the product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) throw productError

    // Get similar products in the same category
    const { data: similarProducts, error: similarError } = await supabase
      .from("products")
      .select("*")
      .eq("category", product.category)
      .neq("id", productId)
      .eq("in_stock", true)
      .limit(limit)

    if (similarError) throw similarError

    return similarProducts as Product[]
  } catch (error) {
    return errorHandler(error, "Error getting similar products", [])
  }
}

/**
 * Get frequently bought together products
 * @param productId Product ID to find frequently bought together products for
 * @param limit Maximum number of products to return
 * @returns Promise with frequently bought together products
 */
export async function getFrequentlyBoughtTogether(productId: string, limit = 4): Promise<Product[]> {
  try {
    // This would ideally use a more sophisticated query with analytics
    // For now, we'll use a simple query to find products that appear in the same orders
    const { data, error } = await supabase.rpc("get_frequently_bought_together", {
      product_id_param: productId,
      limit_count: limit,
    })

    if (error) throw error

    return data as Product[]
  } catch (error) {
    return errorHandler(error, "Error getting frequently bought together products", [])
  }
}
