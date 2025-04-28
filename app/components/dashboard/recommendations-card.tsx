import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Recommendation {
  productId: string
  productName: string
  score: number
}

interface RecommendationsCardProps {
  title: string
  description?: string
  recommendations: Recommendation[]
  className?: string
  userRole: "retailer" | "wholesaler" | "admin"
}

export function RecommendationsCard({
  title,
  description,
  recommendations,
  className,
  userRole,
}: RecommendationsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
              <div key={recommendation.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{recommendation.productName}</p>
                    <p className="text-sm text-muted-foreground">Match score: {recommendation.score.toFixed(0)}%</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link
                    href={
                      userRole === "retailer"
                        ? `/retailer/browse?product=${recommendation.productId}`
                        : `/wholesaler/products?id=${recommendation.productId}`
                    }
                  >
                    <span>View</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No recommendations available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
