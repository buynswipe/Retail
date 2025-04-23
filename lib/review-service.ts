import { supabase } from "./supabase-client"

export interface ProductReview {
  id: string
  product_id: string
  retailer_id: string
  order_item_id?: string
  rating: number
  review_text?: string
  is_verified: boolean
  wholesaler_response?: string
  created_at: string
  updated_at: string
  retailer_name?: string
  retailer_business_name?: string
}

export interface CreateReviewData {
  product_id: string
  retailer_id: string
  order_item_id?: string
  rating: number
  review_text?: string
}

export interface UpdateReviewData {
  rating?: number
  review_text?: string
  wholesaler_response?: string
}

// Get reviews for a product
export async function getProductReviews(productId: string): Promise<{ data: ProductReview[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        *,
        retailer:users!retailer_id(name, business_name)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error }
    }

    // Format the data to include retailer name
    const formattedData = data.map((review) => ({
      ...review,
      retailer_name: review.retailer?.name,
      retailer_business_name: review.retailer?.business_name,
    }))

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error getting product reviews:", error)
    return { data: null, error }
  }
}

// Get reviews by a retailer
export async function getRetailerReviews(retailerId: string): Promise<{ data: ProductReview[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        *,
        product:products(name, image_url, wholesaler_id),
        retailer:users!retailer_id(name, business_name)
      `)
      .eq("retailer_id", retailerId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting retailer reviews:", error)
    return { data: null, error }
  }
}

// Create a new review
export async function createReview(reviewData: CreateReviewData): Promise<{ data: ProductReview | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: reviewData.product_id,
        retailer_id: reviewData.retailer_id,
        order_item_id: reviewData.order_item_id,
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        is_verified: !!reviewData.order_item_id, // Verify if linked to an order
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Error creating review:", error)
    return { data: null, error }
  }
}

// Update a review
export async function updateReview(
  reviewId: string,
  updateData: UpdateReviewData,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("product_reviews")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error updating review:", error)
    return { success: false, error }
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error deleting review:", error)
    return { success: false, error }
  }
}

// Add wholesaler response to a review
export async function addWholesalerResponse(
  reviewId: string,
  response: string,
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from("product_reviews")
      .update({
        wholesaler_response: response,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)

    return { success: !error, error }
  } catch (error) {
    console.error("Error adding wholesaler response:", error)
    return { success: false, error }
  }
}

// Get average rating for a product
export async function getProductAverageRating(
  productId: string,
): Promise<{ rating: number; count: number; error: any }> {
  try {
    const { data, error, count } = await supabase
      .from("product_reviews")
      .select("rating", { count: "exact" })
      .eq("product_id", productId)

    if (error) {
      return { rating: 0, count: 0, error }
    }

    if (!data || data.length === 0) {
      return { rating: 0, count: 0, error: null }
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / data.length

    return { rating: averageRating, count: count || 0, error: null }
  } catch (error) {
    console.error("Error getting product average rating:", error)
    return { rating: 0, count: 0, error }
  }
}

// Check if a retailer has already reviewed a product
export async function hasRetailerReviewedProduct(
  retailerId: string,
  productId: string,
): Promise<{ hasReviewed: boolean; reviewId?: string; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("retailer_id", retailerId)
      .eq("product_id", productId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      return { hasReviewed: false, error }
    }

    return { hasReviewed: !!data, reviewId: data?.id, error: null }
  } catch (error) {
    console.error("Error checking if retailer has reviewed product:", error)
    return { hasReviewed: false, error }
  }
}

// Get products that a retailer can review (purchased but not yet reviewed)
export async function getReviewableProducts(retailerId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    // Get all products the retailer has purchased
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        product_id,
        order_id,
        product:products(id, name, image_url),
        order:orders!inner(status)
      `)
      .eq("order:orders.retailer_id", retailerId)
      .eq("order:orders.status", "delivered")

    if (orderItemsError) {
      return { data: null, error: orderItemsError }
    }

    // Get all products the retailer has already reviewed
    const { data: reviewedProducts, error: reviewedError } = await supabase
      .from("product_reviews")
      .select("product_id")
      .eq("retailer_id", retailerId)

    if (reviewedError) {
      return { data: null, error: reviewedError }
    }

    // Filter out products that have already been reviewed
    const reviewedProductIds = reviewedProducts?.map((review) => review.product_id) || []
    const reviewableItems = orderItems?.filter((item) => !reviewedProductIds.includes(item.product_id)) || []

    // Remove duplicates (same product in different orders)
    const uniqueProducts = Array.from(new Map(reviewableItems.map((item) => [item.product_id, item])).values())

    return { data: uniqueProducts, error: null }
  } catch (error) {
    console.error("Error getting reviewable products:", error)
    return { data: null, error }
  }
}
