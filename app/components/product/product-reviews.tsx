"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Star, ThumbsUp, Flag, MessageSquare, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getProductReviews, addProductReview, likeReview } from "@/lib/review-service"

export interface ProductReviewsProps {
  productId: string
  productName: string
}

export interface Review {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  rating: number
  comment: string
  created_at: string
  likes: number
  user_has_liked?: boolean
  user_has_purchased?: boolean
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState("all")
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: [0, 0, 0, 0, 0], // 1-5 stars
  })

  useEffect(() => {
    loadReviews()
  }, [productId, filter])

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProductReviews(productId, filter)
      if (error) throw error

      setReviews(data.reviews || [])
      setStats(
        data.stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingCounts: [0, 0, 0, 0, 0],
        },
      )

      // Check if user has already reviewed
      if (user) {
        const hasReviewed = data.reviews.some((review: Review) => review.user_id === user.id)
        setUserHasReviewed(hasReviewed)
      }
    } catch (error) {
      console.error("Failed to load reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load product reviews. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review.",
        variant: "destructive",
      })
      return
    }

    if (userRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { success, error } = await addProductReview({
        product_id: productId,
        rating: userRating,
        comment: userReview,
      })

      if (error) throw error

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      })

      // Reset form and reload reviews
      setUserRating(0)
      setUserReview("")
      setShowReviewForm(false)
      loadReviews()
      setUserHasReviewed(true)
    } catch (error) {
      console.error("Failed to submit review:", error)
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like a review.",
        variant: "destructive",
      })
      return
    }

    try {
      const { success, error } = await likeReview(reviewId)
      if (error) throw error

      // Update the reviews state to reflect the like
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review.id === reviewId) {
            const hasLiked = !review.user_has_liked
            return {
              ...review,
              likes: hasLiked ? review.likes + 1 : review.likes - 1,
              user_has_liked: hasLiked,
            }
          }
          return review
        }),
      )
    } catch (error) {
      console.error("Failed to like review:", error)
      toast({
        title: "Error",
        description: "Failed to like the review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReportReview = (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to report a review.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Review Reported",
      description: "Thank you for reporting this review. We will review it shortly.",
    })
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setUserRating(star)}
            className={`${
              interactive ? "cursor-pointer hover:text-yellow-500" : "cursor-default"
            } ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
            disabled={!interactive}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    )
  }

  const renderRatingBars = () => {
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingCounts[5 - rating] || 0
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

          return (
            <div key={rating} className="flex items-center">
              <div className="flex items-center w-12">
                <span className="text-sm font-medium mr-1">{rating}</span>
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `${percentage}%` }}></div>
              </div>
              <div className="w-10 text-right">
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              {t("Customer Reviews")}
            </div>
            {!userHasReviewed && user && (
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant={showReviewForm ? "outline" : "default"}
              >
                {showReviewForm ? t("Cancel") : t("Write a Review")}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Review Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
              <div className="mb-2">{renderStars(stats.averageRating)}</div>
              <p className="text-sm text-gray-500">
                {t("Based on")} {stats.totalReviews} {t("reviews")}
              </p>
            </div>
            <div>{renderRatingBars()}</div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h3 className="font-medium mb-4">{t("Write Your Review")}</h3>
              <div className="mb-4">
                <p className="mb-2">{t("Your Rating")}*</p>
                <div className="flex items-center">
                  {renderStars(userRating, true)}
                  <span className="ml-2 text-sm text-gray-500">
                    {userRating > 0 ? t(`${userRating} Stars`) : t("Select Rating")}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <p className="mb-2">{t("Your Review")}</p>
                <Textarea
                  placeholder={t("Share your experience with this product...")}
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmitReview} disabled={isSubmitting || userRating === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Submitting...")}
                  </>
                ) : (
                  t("Submit Review")
                )}
              </Button>
            </div>
          )}

          {/* Review Filters */}
          <div className="mb-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">{t("All Reviews")}</TabsTrigger>
                <TabsTrigger value="verified">{t("Verified Purchases")}</TabsTrigger>
                <TabsTrigger value="positive">{t("Positive")}</TabsTrigger>
                <TabsTrigger value="critical">{t("Critical")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {filter === "all"
                  ? t("No reviews yet. Be the first to review this product!")
                  : t("No reviews found matching the selected filter.")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={review.user_avatar || "/placeholder.svg"} alt={review.user_name} />
                        <AvatarFallback>{review.user_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.user_name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          {formatDate(review.created_at)}
                          {review.user_has_purchased && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t("Verified Purchase")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>{renderStars(review.rating)}</div>
                  </div>
                  <p className="my-3">{review.comment}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      className={`flex items-center text-sm ${
                        review.user_has_liked ? "text-blue-600" : "text-gray-500"
                      }`}
                      onClick={() => handleLikeReview(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {review.likes} {review.likes === 1 ? t("Like") : t("Likes")}
                    </button>
                    <button
                      className="flex items-center text-sm text-gray-500"
                      onClick={() => handleReportReview(review.id)}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      {t("Report")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
