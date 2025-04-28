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
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/lib/types"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface BatchDialogProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSubmit: (data: {
    productId: string
    batchNumber: string
    quantity: number
    manufacturingDate: Date | null
    expiryDate: Date | null
    notes: string
  }) => Promise<void>
}

export function BatchDialog({ isOpen, onClose, product, onSubmit }: BatchDialogProps) {
  const [batchNumber, setBatchNumber] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(0)
  const [manufacturingDate, setManufacturingDate] = useState<Date | null>(null)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async () => {
    if (!product) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        productId: product.id,
        batchNumber,
        quantity,
        manufacturingDate,
        expiryDate,
        notes,
      })
      resetForm()
      onClose()
    } catch (error) {
      console.error("Failed to add batch:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setBatchNumber("")
    setQuantity(0)
    setManufacturingDate(null)
    setExpiryDate(null)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
          <DialogDescription>
            {product ? `Add a new batch for ${product.name}` : "Add a new product batch"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch-number" className="col-span-1">
              Batch #
            </Label>
            <Input
              id="batch-number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="col-span-3"
            />
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
            <Label htmlFor="manufacturing-date" className="col-span-1">
              Mfg Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !manufacturingDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {manufacturingDate ? format(manufacturingDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={manufacturingDate} onSelect={setManufacturingDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiry-date" className="col-span-1">
              Exp Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    disabled={(date) => (manufacturingDate ? date < manufacturingDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="col-span-1">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this batch"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || quantity <= 0 || !batchNumber}>
            {isSubmitting ? "Adding..." : "Add Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
