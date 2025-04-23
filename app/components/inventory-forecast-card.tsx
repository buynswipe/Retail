"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InventoryForecast } from "@/lib/predictive-analytics-service"

interface InventoryForecastCardProps {
  inventoryForecasts: InventoryForecast[]
}

export function InventoryForecastCard({ inventoryForecasts }: InventoryForecastCardProps) {
  // Sort by days until stockout (ascending)
  const sortedForecasts = [...inventoryForecasts].sort((a, b) => a.days_until_stockout - b.days_until_stockout)

  return (
    <Card className="col-span-3 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Inventory Forecast
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
                    This forecast predicts when you'll run out of stock based on current inventory levels and historical
                    sales patterns.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Predicted inventory needs and stockout dates</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">30-Day Demand</TableHead>
              <TableHead className="text-right">Days Until Stockout</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedForecasts.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-right">{item.current_stock}</TableCell>
                <TableCell className="text-right">{item.predicted_demand}</TableCell>
                <TableCell className="text-right">{item.days_until_stockout}</TableCell>
                <TableCell className="text-center">
                  {item.recommended_reorder ? (
                    <div className="flex items-center justify-center">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Reorder Soon
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-green-50">
                      Sufficient
                    </Badge>
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
