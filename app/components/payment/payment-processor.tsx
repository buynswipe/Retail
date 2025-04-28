"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/app/components/translation-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { initializePayment, verifyPayment, type PaymentGateway } from "@/lib/payment-gateway-integration"
import { formatCurrency } from "@/lib/utils"
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import Script from "next/script"

interface PaymentProcessorProps {
  orderId: string
  amount: number
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
  paymentMethod: PaymentGateway
  onBack: () => void
  onSuccess: (paymentId: string) => void
  onFailure: (error: string) => void
}

export function PaymentProcessor({
  orderId,
  amount,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  description,
  paymentMethod,
  onBack,
  onSuccess,
  onFailure,
}: PaymentProcessorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const initPayment = async () => {
      try {
        setIsProcessing(true)
        setError(null)

        // Handle Cash on Delivery separately
        if (paymentMethod === "cod") {
          const response = await initializePayment({
            orderId,
            amount,
            currency: "INR",
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            description,
            gateway: "cod",
          })

          if (!response.success) {
            throw new Error(response.error || "Failed to initialize COD payment")
          }

          // COD doesn't need further processing
          setPaymentId(response.paymentId)
          onSuccess(response.paymentId || "")
          return
        }

        // Initialize payment for other methods
        const response = await initializePayment({
          orderId,
          amount,
          currency: "INR",
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          description,
          gateway: paymentMethod,
        })

        if (!response.success) {
          throw new Error(response.error || "Failed to initialize payment")
        }

        setPaymentId(response.paymentId || null)
        setPaymentData(response.paymentData || null)

        // Handle redirect-based payment methods
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl
          return
        }

        setIsProcessing(false)
      } catch (error) {
        console.error("Payment initialization error:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize payment")
        setIsProcessing(false)
      }
    }

    initPayment()
  }, [orderId, amount, customerId, customerName, customerEmail, customerPhone, description, paymentMethod, onSuccess])

  const handleRazorpayPayment = async () => {
    if (!paymentData || !paymentId) return

    try {
      const options = {
        ...paymentData,
        handler: async (response: any) => {
          setIsVerifying(true)
          try {
            const verificationResponse = await verifyPayment({
              gateway: "razorpay",
              orderId,
              paymentId: paymentId,
              gatewayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })

            if (verificationResponse.success) {
              onSuccess(paymentId)
            } else {
              throw new Error(verificationResponse.error || "Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            onFailure(error instanceof Error ? error.message : "Payment verification failed")
          } finally {
            setIsVerifying(false)
          }
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You have cancelled the payment process.",
              variant: "destructive",
            })
          },
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#3B82F6",
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("Razorpay payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to process payment")
    }
  }

  const handleUPIPayment = async () => {
    if (!paymentData || !paymentId) return

    try {
      // Open UPI app if on mobile
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = paymentData.upiLink
      } else {
        // Show QR code for desktop
        setPaymentData({
          ...paymentData,
          showQR: true,
        })
      }
    } catch (error) {
      console.error("UPI payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to process UPI payment")
    }
  }

  const handleVerifyUPIPayment = async () => {
    if (!paymentId) return

    setIsVerifying(true)
    try {
      const verificationResponse = await verifyPayment({
        gateway: "upi",
        orderId,
        paymentId: paymentId,
      })

      if (verificationResponse.success) {
        onSuccess(paymentId)
      } else {
        throw new Error(verificationResponse.error || "Payment verification failed")
      }
    } catch (error) {
      console.error("UPI verification error:", error)
      setError(error instanceof Error ? error.message : "UPI payment verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Payment Error")}</CardTitle>
          <CardDescription>{t("There was a problem processing your payment")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("Payment Failed")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back to Payment Methods")}
          </Button>
          <Button variant="default" onClick={() => router.push("/retailer/orders")}>
            {t("View Orders")}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Processing Payment")}</CardTitle>
          <CardDescription>{t("Please wait while we process your payment")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-center text-gray-500">{t("Initializing payment gateway...")}</p>
        </CardContent>
      </Card>
    )
  }

  if (paymentMethod === "razorpay" && paymentData) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Card>
          <CardHeader>
            <CardTitle>{t("Complete Your Payment")}</CardTitle>
            <CardDescription>{t("You will be redirected to Razorpay to complete your payment")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("Order ID")}</span>
                <span className="font-medium">#{orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("Amount")}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">{t("Payment Method")}</span>
                <span className="font-medium">{t("Credit/Debit Card")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("Back")}
            </Button>
            <Button onClick={handleRazorpayPayment}>
              {t("Pay")} {formatCurrency(amount)}
            </Button>
          </CardFooter>
        </Card>
      </>
    )
  }

  if (paymentMethod === "upi" && paymentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("UPI Payment")}</CardTitle>
          <CardDescription>
            {paymentData.showQR
              ? t("Scan the QR code with any UPI app to pay")
              : t("Click the button below to open your UPI app")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("Order ID")}</span>
                <span className="font-medium">#{orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("Amount")}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("UPI ID")}</span>
                <span className="font-medium">{paymentData.upiId}</span>
              </div>
              <Separator />
            </div>

            {paymentData.showQR ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={`https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(
                      paymentData.upiLink,
                    )}&chs=250x250&choe=UTF-8&chld=L|2`}
                    alt="UPI QR Code"
                    width={250}
                    height={250}
                  />
                </div>
                <p className="text-sm text-center mt-4 text-gray-500">
                  {t("Scan this QR code with any UPI app like Google Pay, PhonePe, Paytm, etc.")}
                </p>
              </div>
            ) : (
              <Button className="w-full" onClick={handleUPIPayment}>
                {t("Pay with UPI")}
              </Button>
            )}

            <Alert>
              <AlertTitle>{t("After making the payment")}</AlertTitle>
              <AlertDescription>
                {t(
                  "After completing the payment in your UPI app, please come back here and click the 'Verify Payment' button below.",
                )}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
          <Button onClick={handleVerifyUPIPayment} disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Verifying...")}
              </>
            ) : (
              t("Verify Payment")
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Payment Method Not Supported")}</CardTitle>
        <CardDescription>{t("The selected payment method is not currently supported")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("Unsupported Payment Method")}</AlertTitle>
          <AlertDescription>
            {t("The selected payment method is not currently supported. Please choose another payment method.")}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back to Payment Methods")}
        </Button>
      </CardFooter>
    </Card>
  )
}
