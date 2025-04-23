"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryMetrics } from "@/lib/analytics-service"
import { Progress } from "@/components/ui/progress"
import { Package, AlertTriangle, XCircle } from "lucide-react"

interface InventoryMetricsCardProps {
  inventoryMetrics: InventoryMetrics
}

export function InventoryMetricsCard({ inventoryMetrics }: InventoryMetricsCardProps) {
  // Calculate percentages
  const lowStockPercentage = Math.round((inventoryMetrics.low_stock_products / inventoryMetrics.total_products) * 100)
  const outOfStockPercentage = Math.round(
    (inventoryMetrics.out_of_stock_products / inventoryMetrics.total_products) * 100,
  )

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>Overview of your product inventory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold">{inventoryMetrics.total_products}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <span className="text-sm font-medium">
              {inventoryMetrics.total_products -
                inventoryMetrics.low_stock_products -
                inventoryMetrics.out_of_stock_products}
            </span>
          </div>
          <Progress value={100 - lowStockPercentage - outOfStockPercentage} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <span className="text-sm font-medium">{inventoryMetrics.low_stock_products}</span>
          </div>
          <Progress value={lowStockPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-amber-500" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
            <span className="text-sm font-medium">{inventoryMetrics.out_of_stock_products}</span>
          </div>
          <Progress value={outOfStockPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}
