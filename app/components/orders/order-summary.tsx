"use client"

import { formatCurrency } from "@/lib/utils"
import { useTranslation } from "@/lib/use-safe-translation"

export function OrderSummary({ order }: { order: any }) {
  const { t } = useTranslation()

  if (!order) return null

  const subtotal = order.items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0
  const tax = order.tax_amount || 0
  const shipping = order.shipping_fee || 0
  const discount = order.discount_amount || 0
  const total = order.total_amount || subtotal + tax + shipping - discount

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="text-gray-500">{t("Subtotal")}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-500">{t("Tax")}</span>
        <span>{formatCurrency(tax)}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-gray-500">{t("Shipping")}</span>
        <span>{formatCurrency(shipping)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500">{t("Discount")}</span>
          <span className="text-green-600">-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="pt-4 border-t flex justify-between font-medium text-lg">
        <span>{t("Total")}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export default OrderSummary
