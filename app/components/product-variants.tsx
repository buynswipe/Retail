"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  attributes: Record<string, string>
}

interface ProductVariantsProps {
  variants: ProductVariant[]
  onVariantSelect: (variant: ProductVariant) => void
  selectedVariantId?: string
  className?: string
}

export default function ProductVariants({
  variants,
  onVariantSelect,
  selectedVariantId,
  className,
}: ProductVariantsProps) {
  const [selectedId, setSelectedId] = useState<string>(selectedVariantId || variants[0]?.id || "")

  // Get all unique attribute types across variants
  const attributeTypes = Array.from(new Set(variants.flatMap((variant) => Object.keys(variant.attributes))))

  // Get all unique values for each attribute type
  const attributeValues: Record<string, string[]> = {}
  attributeTypes.forEach((attrType) => {
    attributeValues[attrType] = Array.from(
      new Set(variants.map((variant) => variant.attributes[attrType]).filter(Boolean)),
    )
  })

  // Find the selected variant
  const selectedVariant = variants.find((v) => v.id === selectedId) || variants[0]

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedId(variant.id)
    onVariantSelect(variant)
  }

  // Handle attribute selection
  const handleAttributeSelect = (attrType: string, value: string) => {
    // Find a variant that matches the current selection but with the new attribute value
    const currentAttributes = { ...selectedVariant.attributes }
    currentAttributes[attrType] = value

    // Find the best matching variant
    const bestMatch = findBestMatchingVariant(variants, currentAttributes)

    if (bestMatch) {
      setSelectedId(bestMatch.id)
      onVariantSelect(bestMatch)
    }
  }

  // Find the best matching variant based on attributes
  const findBestMatchingVariant = (
    variants: ProductVariant[],
    targetAttributes: Record<string, string>,
  ): ProductVariant | undefined => {
    // Calculate match score for each variant
    const variantsWithScores = variants.map((variant) => {
      let score = 0
      const variantAttrs = variant.attributes

      // Count matching attributes
      Object.entries(targetAttributes).forEach(([key, value]) => {
        if (variantAttrs[key] === value) {
          score++
        }
      })

      return { variant, score }
    })

    // Sort by score (highest first)
    variantsWithScores.sort((a, b) => b.score - a.score)

    // Return the variant with the highest score
    return variantsWithScores[0]?.variant
  }

  // Check if a variant with specific attribute is available
  const isAttributeAvailable = (attrType: string, value: string): boolean => {
    return variants.some((variant) => variant.attributes[attrType] === value && variant.stock > 0)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {attributeTypes.map((attrType) => (
        <div key={attrType} className="space-y-2">
          <h3 className="text-sm font-medium capitalize text-gray-700">{attrType.replace(/_/g, " ")}</h3>

          {/* For attributes with few values, use buttons */}
          {attributeValues[attrType].length <= 5 ? (
            <div className="flex flex-wrap gap-2">
              {attributeValues[attrType].map((value) => {
                const isSelected = selectedVariant.attributes[attrType] === value
                const isAvailable = isAttributeAvailable(attrType, value)

                return (
                  <Button
                    key={`${attrType}-${value}`}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn("h-9 px-3", !isAvailable && "opacity-50 cursor-not-allowed")}
                    onClick={() => isAvailable && handleAttributeSelect(attrType, value)}
                    disabled={!isAvailable}
                  >
                    {isSelected && <Check className="mr-1 h-3 w-3" />}
                    {value}
                  </Button>
                )
              })}
            </div>
          ) : (
            /* For attributes with many values, use radio group */
            <RadioGroup
              value={selectedVariant.attributes[attrType]}
              onValueChange={(value) => handleAttributeSelect(attrType, value)}
              className="flex flex-col space-y-1"
            >
              {attributeValues[attrType].map((value) => {
                const isAvailable = isAttributeAvailable(attrType, value)

                return (
                  <div key={`${attrType}-${value}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`${attrType}-${value}`} disabled={!isAvailable} />
                    <Label htmlFor={`${attrType}-${value}`} className={cn(!isAvailable && "opacity-50")}>
                      {value}
                      {!isAvailable && " (Out of stock)"}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          )}
        </div>
      ))}

      {/* Display selected variant info */}
      {selectedVariant && (
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Selected:</span>
            <span className="text-sm text-gray-500">{Object.values(selectedVariant.attributes).join(" / ")}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Price:</span>
            <span className="text-sm font-semibold">₹{selectedVariant.price.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Stock:</span>
            <span
              className={cn(
                "text-sm",
                selectedVariant.stock > 10
                  ? "text-green-600"
                  : selectedVariant.stock > 0
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {selectedVariant.stock > 0 ? `${selectedVariant.stock} available` : "Out of stock"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
