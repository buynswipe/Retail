"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/lib/types"

interface StockAdjustmentDialogProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSubmit: (data: {
    productId: string
    quantity: number
    adjustmentType: "increase" | "decrease"
    reason: string
    notes: string
  }) => Promise<void>
}

export function StockAdjustmentDialog({ isOpen, onClose, product, onSubmit }: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState<number>(0)
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase")
  const [reason, setReason] = useState<string>("correction")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async () => {
    if (!product) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        productId: product.id,
        quantity,
        adjustmentType,
        reason,
        notes,
      })
      resetForm()
      onClose()
    } catch (error) {
      console.error("Failed to adjust stock:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setQuantity(0)
    setAdjustmentType("increase")
    setReason("correction")
    setNotes("")
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            {product ? `Update stock levels for ${product.name}` : "Update stock levels"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="adjustment-type" className="col-span-1">
              Type
            </Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as "increase" | "decrease")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">Increase</SelectItem>
                <SelectItem value="decrease">Decrease</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="col-span-1">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity || ""}
              onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="col-span-1">
              Reason
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correction">Inventory Correction</SelectItem>
                <SelectItem value="damaged">Damaged/Expired</SelectItem>
                <SelectItem value="returned">Customer Return</SelectItem>
                <SelectItem value="supplier">Supplier Delivery</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="col-span-1">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this adjustment"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || quantity <= 0}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
