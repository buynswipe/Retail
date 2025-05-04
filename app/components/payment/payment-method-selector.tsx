"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PayUPayment } from "./payu-payment"
import { PaytmPayment } from "./paytm-payment"
import { PhonePePayment } from "./phonepe-payment"
import { CashOnDeliveryPayment } from "./cash-on-delivery-payment"

interface PaymentMethodSelectorProps {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

type PaymentMethod = "payu" | "paytm" | "phonepe" | "cod"

export function PaymentMethodSelector({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("payu")

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Select Payment Method</h3>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
          className="mt-3 space-y-3"
        >
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="payu" id="payu" />
            <Label htmlFor="payu" className="flex-1 cursor-pointer">
              PayU (Recommended)
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="paytm" id="paytm" />
            <Label htmlFor="paytm" className="flex-1 cursor-pointer">
              Paytm
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="phonepe" id="phonepe" />
            <Label htmlFor="phonepe" className="flex-1 cursor-pointer">
              PhonePe
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="flex-1 cursor-pointer">
              Cash on Delivery
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="mt-6">
        {selectedMethod === "payu" && (
          <PayUPayment
            orderId={orderId}
            amount={amount}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={onSuccess}
            onFailure={onFailure}
          />
        )}
        {selectedMethod === "paytm" && (
          <PaytmPayment
            orderId={orderId}
            amount={amount}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={onSuccess}
            onFailure={onFailure}
          />
        )}
        {selectedMethod === "phonepe" && (
          <PhonePePayment
            orderId={orderId}
            amount={amount}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={onSuccess}
            onFailure={onFailure}
          />
        )}
        {selectedMethod === "cod" && (
          <CashOnDeliveryPayment orderId={orderId} amount={amount} onSuccess={onSuccess} onFailure={onFailure} />
        )}
      </div>
    </div>
  )
}
