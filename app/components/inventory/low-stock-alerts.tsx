"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { InventoryItem } from "@/lib/types"

interface LowStockAlertsProps {
  lowStockItems: InventoryItem[]
  onAdjustStock: (productId: string) => void
}

export function LowStockAlerts({ lowStockItems, onAdjustStock }: LowStockAlertsProps) {
  if (lowStockItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="bg-amber-50">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <CardTitle className="text-amber-800">Low Stock Alerts</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          {lowStockItems.length} products require your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {lowStockItems.map((item) => (
            <li key={item.product.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded bg-gray-100 p-1 mr-3 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      Current: {item.quantity} {item.product.unit}
                    </span>
                    <span className="mx-2">•</span>
                    <span>
                      Threshold: {item.lowStockThreshold} {item.product.unit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.quantity <= 0 ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : (
                  <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Low Stock
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => onAdjustStock(item.product.id)}>
                  Restock
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-4 bg-gray-50">
          <Link href="/wholesaler/inventory" passHref>
            <Button variant="ghost" className="w-full" size="sm">
              View All Inventory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
