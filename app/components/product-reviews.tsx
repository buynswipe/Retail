"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare, ThumbsUp, Flag, ChevronDown, ChevronUp } from "lucide-react"
import { getProductReviews, addWholesalerResponse, type ProductReview } from "@/lib/review-service"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ProductReviewsProps {
  productId: string
  initialRating?: number
  initialCount?: number
}

export default function ProductReviews({ productId, initialRating = 0, initialCount = 0 }: ProductReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedReviews, setExpandedReviews] = useState<string[]>([])
  const [responseText, setResponseText] = useState<Record<string, string>>({})
  const [submittingResponse, setSubmittingResponse] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState(false)
  const [averageRating, setAverageRating] = useState(initialRating)
  const [reviewCount, setReviewCount] = useState(initialCount)

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await getProductReviews(productId)
      if (error) {
        console.error("Error loading reviews:", error)
        toast({
          title: "Error",
          description: "Failed to load reviews. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setReviews(data)

        // Calculate average rating if not provided
        if (initialRating === 0 && data.length > 0) {
          const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
          setAverageRating(totalRating / data.length)
          setReviewCount(data.length)
        }
      }
    } catch (error) {
      console.error("Error loading reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => (prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]))
  }

  const handleResponseChange = (reviewId: string, text: string) => {
    setResponseText((prev) => ({ ...prev, [reviewId]: text }))
  }

  const submitResponse = async (reviewId: string) => {
    if (!responseText[reviewId]?.trim()) return

    setSubmittingResponse((prev) => ({ ...prev, [reviewId]: true }))
    try {
      const { success, error } = await addWholesalerResponse(reviewId, responseText[reviewId])
      if (error) {
        console.error("Error submitting response:", error)
        toast({
          title: "Error",
          description: "Failed to submit response. Please try again.",
          variant: "destructive",
        })
      } else if (success) {
        toast({
          title: "Success",
          description: "Response submitted successfully.",
        })
        // Update the review in the local state
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, wholesaler_response: responseText[reviewId] } : review,
          ),
        )
        // Clear the response text
        setResponseText((prev) => ({ ...prev, [reviewId]: "" }))
      }
    } catch (error) {
      console.error("Error submitting response:", error)
    } finally {
      setSubmittingResponse((prev) => ({ ...prev, [reviewId]: false }))
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} className={`h-4 w-4 ${index < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews & Ratings
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500">({reviewCount})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt={review.retailer_name || "Reviewer"} />
                      <AvatarFallback>{(review.retailer_name || "R").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {review.retailer_business_name || review.retailer_name || "Retailer"}
                        </h3>
                        {review.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpandReview(review.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedReviews.includes(review.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {review.review_text && (
                  <div className="mt-3">
                    <p className="text-gray-700">{review.review_text}</p>
                  </div>
                )}

                {/* Wholesaler Response */}
                {review.wholesaler_response && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-50">
                        Wholesaler Response
                      </Badge>
                    </div>
                    <p className="text-gray-700">{review.wholesaler_response}</p>
                  </div>
                )}

                {/* Response Form for Wholesalers */}
                {expandedReviews.includes(review.id) && user?.role === "wholesaler" && !review.wholesaler_response && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Respond to this review</h4>
                    <Textarea
                      placeholder="Write your response..."
                      value={responseText[review.id] || ""}
                      onChange={(e) => handleResponseChange(review.id, e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      onClick={() => submitResponse(review.id)}
                      disabled={!responseText[review.id] || submittingResponse[review.id]}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {submittingResponse[review.id] ? "Submitting..." : "Submit Response"}
                    </Button>
                  </div>
                )}

                {/* Review Actions */}
                {expandedReviews.includes(review.id) && (
                  <div className="mt-4 flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <Flag className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {reviews.length > 3 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-500 border-blue-500 hover:bg-blue-50"
                >
                  {showAll ? "Show Less" : `Show All Reviews (${reviews.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
        <Toaster />
      </CardContent>
    </Card>
  )
}
