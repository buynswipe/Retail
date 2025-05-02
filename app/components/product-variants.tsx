"use client"

import { useState, useMemo, useCallback } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/lib/cart-context"
import { OptimizedImage } from "./optimized-image"

export interface Variant {
  id: string
  name: string
  price: number
  stock: number
  image_url?: string
  weight: string
  unit: string
}

interface ProductVariantsProps {
  productId: string
  productName: string
  variants: Variant[]
  onVariantSelect?: (variant: Variant) => void
}

export function ProductVariants({ productId, productName, variants, onVariantSelect }: ProductVariantsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants.length > 0 ? variants[0].id : "")
  const [quantity, setQuantity] = useState<number>(1)
  const { addToCart } = useCart()

  // Memoize the selected variant to prevent unnecessary recalculations
  const selectedVariant = useMemo(() => {
    return variants.find((variant) => variant.id === selectedVariantId) || variants[0]
  }, [variants, selectedVariantId])

  // Memoize the available stock for the selected variant
  const availableStock = useMemo(() => {
    return selectedVariant ? selectedVariant.stock : 0
  }, [selectedVariant])

  // Memoize the formatted price to prevent recalculation on every render
  const formattedPrice = useMemo(() => {
    if (!selectedVariant) return "₹0.00"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(selectedVariant.price)
  }, [selectedVariant])

  // Memoize the variant options to prevent recreating the array on every render
  const variantOptions = useMemo(() => {
    return variants.map((variant) => ({
      id: variant.id,
      label: `${variant.weight} ${variant.unit} - ₹${variant.price.toFixed(2)}`,
      inStock: variant.stock > 0,
    }))
  }, [variants])

  const handleVariantChange = useCallback(
    (value: string) => {
      setSelectedVariantId(value)
      const newVariant = variants.find((v) => v.id === value)
      if (newVariant && onVariantSelect) {
        onVariantSelect(newVariant)
      }
      // Reset quantity to 1 when changing variants
      setQuantity(1)
    },
    [variants, onVariantSelect],
  )

  const incrementQuantity = useCallback(() => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1)
    }
  }, [quantity, availableStock])

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }, [quantity])

  const handleAddToCart = useCallback(() => {
    if (selectedVariant && quantity > 0) {
      addToCart({
        productId,
        productName,
        variantId: selectedVariant.id,
        variantName: `${selectedVariant.weight} ${selectedVariant.unit}`,
        price: selectedVariant.price,
        quantity,
        imageUrl: selectedVariant.image_url,
        maxQuantity: selectedVariant.stock,
      })
    }
  }, [productId, productName, selectedVariant, quantity, addToCart])

  // Early return if no variants are available
  if (!variants.length) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600">No variants available for this product</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {selectedVariant?.image_url && (
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <OptimizedImage
              src={selectedVariant.image_url}
              alt={`${productName} - ${selectedVariant.weight} ${selectedVariant.unit}`}
              width={300}
              height={300}
              className="rounded-md object-cover w-full h-auto"
            />
          </div>
        )}

        <div className="w-full md:w-2/3">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2" id="variants-label">
              Select Variant
            </h3>
            <RadioGroup
              value={selectedVariantId}
              onValueChange={handleVariantChange}
              className="space-y-2"
              aria-labelledby="variants-label"
            >
              {variantOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={`variant-${option.id}`}
                    disabled={!option.inStock}
                    aria-label={option.label}
                  />
                  <Label htmlFor={`variant-${option.id}`} className={!option.inStock ? "text-gray-400" : ""}>
                    {option.label}
                    {!option.inStock && <span className="ml-2 text-red-500">(Out of stock)</span>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2" id="quantity-label">
              Quantity
            </h3>
            <div className="flex items-center space-x-2" aria-labelledby="quantity-label">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                -
              </Button>
              <span className="w-12 text-center" aria-live="polite" aria-atomic="true">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={incrementQuantity}
                disabled={quantity >= availableStock}
                aria-label="Increase quantity"
              >
                +
              </Button>
              <span className="text-sm text-gray-500 ml-2">{availableStock} available</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xl font-bold" aria-live="polite">
              {formattedPrice}
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant || availableStock === 0}
              aria-label={`Add ${productName} to cart`}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
