"use client"

import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface PaymentSuccessProps {
  orderId: string
  amount: number
  paymentId: string
  paymentMethod: string
}

export function PaymentSuccess({ orderId, amount, paymentId, paymentMethod }: PaymentSuccessProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">{t("Payment Successful!")}</CardTitle>
        <CardDescription>{t("Your payment has been processed successfully")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("Order ID")}</span>
            <span className="font-medium">#{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("Payment ID")}</span>
            <span className="font-medium">#{paymentId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("Payment Method")}</span>
            <span className="font-medium">{paymentMethod}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-gray-500">{t("Amount Paid")}</span>
            <span className="font-bold text-lg">{formatCurrency(amount)}</span>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">
            {t(
              "A confirmation email has been sent to your registered email address. You can also view your order details in the Orders section.",
            )}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href={`/retailer/orders/${orderId}`}>
            {t("View Order Details")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button className="w-full sm:w-auto" asChild>
          <Link href="/retailer/orders">
            {t("Go to My Orders")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
