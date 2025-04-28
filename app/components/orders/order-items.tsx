"use client"

import { formatCurrency } from "@/lib/utils"
import { useTranslation } from "@/lib/use-safe-translation"
import Image from "next/image"
import { Package } from "lucide-react"

export function OrderItems({ items }: { items: any[] }) {
  const { t } = useTranslation()

  if (!items || items.length === 0) {
    return <div className="text-gray-500">{t("No items in this order")}</div>
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id || index} className="flex items-center gap-4 py-3 border-b last:border-b-0">
          <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            {item.product?.image_url ? (
              <Image
                src={item.product.image_url || "/placeholder.svg"}
                alt={item.product.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-grow">
            <h4 className="font-medium">{item.product?.name}</h4>
            <div className="text-sm text-gray-500">
              {item.variant_name && <span>{item.variant_name} • </span>}
              <span>
                {formatCurrency(item.price)} × {item.quantity}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderItems
