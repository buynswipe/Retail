"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PerformancePrediction } from "@/lib/predictive-analytics-service"

interface ProductPredictionCardProps {
  predictions: PerformancePrediction[]
}

export function ProductPredictionCard({ predictions }: ProductPredictionCardProps) {
  // Sort by growth percentage (descending)
  const sortedPredictions = [...predictions].sort((a, b) => b.growth_percentage - a.growth_percentage)

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Product Trends
          <Badge variant="outline" className="ml-2">
            Predictive
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  This prediction shows expected sales trends for your products over the next 30 days.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Predicted product performance for next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Predicted Sales</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPredictions.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.predicted_sales)}</TableCell>
                <TableCell
                  className={`text-right ${
                    item.growth_percentage > 0 ? "text-green-600" : item.growth_percentage < 0 ? "text-red-600" : ""
                  }`}
                >
                  {item.growth_percentage > 0 ? "+" : ""}
                  {item.growth_percentage}%
                </TableCell>
                <TableCell className="text-center">
                  {item.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                  ) : item.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-600 mx-auto" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
