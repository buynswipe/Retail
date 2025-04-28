"use client"

import { useState } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Loader2, CreditCard, Wallet, IndianRupee, Truck, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import type { PaymentGateway } from "@/lib/payment-gateway-integration"

interface PaymentMethodsProps {
  amount: number
  onSelectPaymentMethod: (method: PaymentGateway) => void
  onProceed: () => void
  isProcessing: boolean
}

export function PaymentMethods({ amount, onSelectPaymentMethod, onProceed, isProcessing }: PaymentMethodsProps) {
  const { t } = useTranslation()
  const [selectedMethod, setSelectedMethod] = useState<PaymentGateway>("upi")
  const [upiId, setUpiId] = useState("")
  const [upiIdError, setUpiIdError] = useState("")

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value as PaymentGateway)
    onSelectPaymentMethod(value as PaymentGateway)
    setUpiIdError("")
  }

  const handleProceed = () => {
    if (selectedMethod === "upi" && !upiId) {
      setUpiIdError("Please enter your UPI ID")
      return
    }

    if (selectedMethod === "upi" && !validateUpiId(upiId)) {
      setUpiIdError("Please enter a valid UPI ID")
      return
    }

    onProceed()
  }

  const validateUpiId = (id: string) => {
    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/
    return upiRegex.test(id)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("Select Payment Method")}</CardTitle>
        <CardDescription>{t("Choose how you want to pay")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange} className="space-y-4">
          {/* UPI Payment */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex items-center">
                <Image src="/UPI-symbol.png" alt="UPI" width={24} height={24} className="mr-2" />
                {t("UPI Payment")}
              </Label>
              <div className="ml-auto flex gap-2">
                <Image src="/payment-icons/gpay.svg" alt="Google Pay" width={24} height={24} />
                <Image src="/payment-icons/phonepe.svg" alt="Google Pay" width={24} height={24} />
                <Image src="/payment-icons/phonepe.svg" alt="PhonePe" width={24} height={24} />
                <Image src="/payment-icons/paytm.svg" alt="Paytm" width={24} height={24} />
              </div>
            </div>
            <div className="pl-7 mt-2">
              <Input
                placeholder={t("Enter your UPI ID (e.g. name@upi)")}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className={upiIdError ? "border-red-500" : ""}
              />
              {upiIdError && <p className="text-sm text-red-500 mt-1">{upiIdError}</p>}
            </div>
          </div>

          {/* Credit/Debit Card */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="razorpay" id="card" />
            <Label htmlFor="card" className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
              {t("Credit / Debit Card")}
            </Label>
            <div className="ml-auto flex gap-2">
              <Image src="/payment-icons/visa.svg" alt="Visa" width={32} height={24} />
              <Image src="/payment-icons/mastercard.svg" alt="Mastercard" width={32} height={24} />
              <Image src="/payment-icons/rupay.svg" alt="RuPay" width={32} height={24} />
            </div>
          </div>

          {/* Netbanking */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="payu" id="netbanking" />
            <Label htmlFor="netbanking" className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-green-500" />
              {t("Netbanking")}
            </Label>
            <div className="ml-auto flex gap-2">
              <Image src="/payment-icons/sbi.svg" alt="SBI" width={24} height={24} />
              <Image src="/payment-icons/hdfc.svg" alt="HDFC" width={24} height={24} />
              <Image src="/payment-icons/icici.svg" alt="ICICI" width={24} height={24} />
              <span className="text-xs text-gray-500">+20 more</span>
            </div>
          </div>

          {/* Wallets */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paytm" id="wallet" />
            <Label htmlFor="wallet" className="flex items-center">
              <IndianRupee className="h-5 w-5 mr-2 text-purple-500" />
              {t("Wallets")}
            </Label>
            <div className="ml-auto flex gap-2">
              <Image src="/payment-icons/paytm.svg" alt="Paytm" width={24} height={24} />
              <Image src="/payment-icons/amazonpay.svg" alt="Amazon Pay" width={24} height={24} />
              <Image src="/payment-icons/mobikwik.svg" alt="MobiKwik" width={24} height={24} />
            </div>
          </div>

          {/* Cash on Delivery */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-gray-500" />
              {t("Cash on Delivery")}
            </Label>
            <div className="ml-auto">
              <span className="text-xs text-gray-500">{t("Pay when you receive")}</span>
            </div>
          </div>
        </RadioGroup>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("Order Total")}</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>

          {selectedMethod === "cod" && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{t("Cash on Delivery")}</p>
                  <p className="text-xs text-amber-700">
                    {t(
                      "Please keep exact change ready. Our delivery partner will collect the payment at the time of delivery.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleProceed} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Processing...")}
            </>
          ) : (
            t("Proceed to Pay")
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
