import { supabase } from "./supabase-client"
import { createNotification } from "./notification-service"

export interface ReviewData {
  product_id: string
  rating: number
  comment: string
}

// Get product reviews with filtering options
export async function getProductReviews(productId: string, filter = "all"): Promise<{ data: any; error: any }> {
  try {
    // Build query for reviews
    let query = supabase
      .from("product_reviews")
      .select(
        `
        id,
        user_id,
        users:user_id (name, avatar_url),
        rating,
        comment,
        created_at,
        likes,
        user_has_purchased
      `,
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    // Apply filters
    switch (filter) {
      case "verified":
        query = query.eq("user_has_purchased", true)
        break
      case "positive":
        query = query.gte("rating", 4)
        break
      case "critical":
        query = query.lte("rating", 3)
        break
      default:
        break
    }

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      throw reviewsError
    }

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      user_id: review.user_id,
      user_name: review.users?.name || "Anonymous",
      user_avatar: review.users?.avatar_url,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      likes: review.likes || 0,
      user_has_purchased: review.user_has_purchased,
    }))

    // Get review statistics
    const { data: stats, error: statsError } = await supabase.rpc("get_product_review_stats", {
      p_product_id: productId,
    })

    if (statsError) {
      throw statsError
    }

    // Check if current user has liked any reviews
    const { data: auth } = await supabase.auth.getSession()
    if (auth?.session?.user) {
      const userId = auth.session.user.id
      const { data: likedReviews, error: likedError } = await supabase
        .from("review_likes")
        .select("review_id")
        .eq("user_id", userId)

      if (!likedError && likedReviews) {
        const likedReviewIds = likedReviews.map((like) => like.review_id)
        formattedReviews.forEach((review) => {
          review.user_has_liked = likedReviewIds.includes(review.id)
        })
      }
    }

    return {
      data: {
        reviews: formattedReviews,
        stats: stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingCounts: [0, 0, 0, 0, 0],
        },
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting product reviews:", error)
    return { data: null, error }
  }
}

// Add a new product review
export async function addProductReview(reviewData: ReviewData): Promise<{ success: boolean; error: any }> {
  try {
    const { data: auth } = await supabase.auth.getSession()
    if (!auth?.session?.user) {
      throw new Error("User not authenticated")
    }

    const userId = auth.session.user.id

    // Check if user has already reviewed this product
    const { data: existingReview, error: checkError } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", reviewData.product_id)
      .eq("user_id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is what we want
      throw checkError
    }

    if (existingReview) {
      throw new Error("You have already reviewed this product")
    }

    // Check if user has purchased the product
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", reviewData.product_id)
      .in("order_id", supabase.from("orders").select("id").eq("retailer_id", userId).eq("status", "delivered"))
      .limit(1)

    const userHasPurchased = orderItems && orderItems.length > 0

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: reviewData.product_id,
        user_id: userId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        user_has_purchased: userHasPurchased,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Get product details for notification
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, user_id")
      .eq("id", reviewData.product_id)
      .single()

    if (productError) {
      throw productError
    }

    // Notify product owner (wholesaler)
    await createNotification({
      user_id: product.user_id,
      title: "New Product Review",
      message: `Your product "${product.name}" has received a new ${reviewData.rating}-star review.`,
      type: "review",
      reference_id: reviewData.product_id,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error adding product review:", error)
    return { success: false, error }
  }
}

// Like or unlike a review
export async function likeReview(reviewId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: auth } = await supabase.auth.getSession()
    if (!auth?.session?.user) {
      throw new Error("User not authenticated")
    }

    const userId = auth.session.user.id

    // Check if user has already liked this review
    const { data: existingLike, error: checkError } = await supabase
      .from("review_likes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows returned
      throw checkError
    }

    if (existingLike) {
      // User has already liked, so unlike
      const { error: deleteError } = await supabase.from("review_likes").delete().eq("id", existingLike.id)

      if (deleteError) {
        throw deleteError
      }

      // Decrement likes count
      const { error: updateError } = await supabase.rpc("decrement_review_likes", {
        p_review_id: reviewId,
      })

      if (updateError) {
        throw updateError
      }
    } else {
      // User hasn't liked, so add like
      const { error: insertError } = await supabase.from("review_likes").insert({
        review_id: reviewId,
        user_id: userId,
      })

      if (insertError) {
        throw insertError
      }

      // Increment likes count
      const { error: updateError } = await supabase.rpc("increment_review_likes", {
        p_review_id: reviewId,
      })

      if (updateError) {
        throw updateError
      }

      // Get review details for notification
      const { data: review, error: reviewError } = await supabase
        .from("product_reviews")
        .select("user_id, product_id, products:product_id(name)")
        .eq("id", reviewId)
        .single()

      if (reviewError) {
        throw reviewError
      }

      // Notify review author if it's not their own like
      if (review.user_id !== userId) {
        await createNotification({
          user_id: review.user_id,
          title: "Someone Liked Your Review",
          message: `Someone liked your review for "${review.products.name}".`,
          type: "review_like",
          reference_id: reviewId,
        })
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error liking review:", error)
    return { success: false, error }
  }
}

// Get reviews by user
export async function getUserReviews(userId: string): Promise<{ data: any[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        likes,
        products:product_id (id, name, image_url)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting user reviews:", error)
    return { data: [], error }
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: auth } = await supabase.auth.getSession()
    if (!auth?.session?.user) {
      throw new Error("User not authenticated")
    }

    const userId = auth.session.user.id

    // Check if user is the author of the review
    const { data: review, error: checkError } = await supabase
      .from("product_reviews")
      .select("user_id")
      .eq("id", reviewId)
      .single()

    if (checkError) {
      throw checkError
    }

    if (review.user_id !== userId) {
      throw new Error("You can only delete your own reviews")
    }

    // Delete review
    const { error: deleteError } = await supabase.from("product_reviews").delete().eq("id", reviewId)

    if (deleteError) {
      throw deleteError
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting review:", error)
    return { success: false, error }
  }
}
