"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DeliveryMetrics } from "@/lib/analytics-service"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"

interface DeliveryMetricsCardProps {
  deliveryMetrics: DeliveryMetrics
}

export function DeliveryMetricsCard({ deliveryMetrics }: DeliveryMetricsCardProps) {
  // Calculate on-time delivery percentage
  const onTimePercentage = Math.round((deliveryMetrics.on_time_deliveries / deliveryMetrics.total_deliveries) * 100)

  return (
    <Card className="col-span-3 md:col-span-1">
      <CardHeader>
        <CardTitle>Delivery Performance</CardTitle>
        <CardDescription>Overview of your delivery operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
          <p className="text-2xl font-bold">{deliveryMetrics.total_deliveries}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm font-medium">On-time Deliveries</span>
            </div>
            <span className="text-sm font-medium">{deliveryMetrics.on_time_deliveries}</span>
          </div>
          <Progress value={onTimePercentage} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              <span className="text-sm font-medium">Delayed Deliveries</span>
            </div>
            <span className="text-sm font-medium">{deliveryMetrics.delayed_deliveries}</span>
          </div>
          <Progress value={100 - onTimePercentage} className="h-2 bg-gray-200" indicatorClassName="bg-amber-500" />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Average Delivery Time</p>
              <p className="text-lg font-bold">{deliveryMetrics.average_delivery_time} hours</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
