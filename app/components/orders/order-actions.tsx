"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Order } from "@/lib/types"
import { cancelOrder } from "@/lib/order-service"

interface OrderActionsProps {
  order: Order
  onOrderUpdated: (updatedOrder: Order) => void
}

export default function OrderActions({ order, onOrderUpdated }: OrderActionsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      setError("Please provide a reason for cancellation")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updatedOrder = await cancelOrder(order.id, cancellationReason)
      onOrderUpdated(updatedOrder)
      setCancelDialogOpen(false)
    } catch (err) {
      setError("Failed to cancel the order. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only show cancel button if order is in PENDING status
  const showCancelButton = order.status === "PENDING"

  return (
    <>
      <div className="flex flex-wrap gap-3 mt-6">
        {showCancelButton && (
          <Button
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Cancel Order
          </Button>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="py-2">
            <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Cancellation
            </label>
            <Textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
