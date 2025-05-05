"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PayUPaymentFormProps {
  payuData: {
    key: string
    txnid: string
    amount: string
    productinfo: string
    firstname: string
    email: string
    udf1: string
    surl: string
    furl: string
    hash: string
    [key: string]: string
  }
  payuUrl: string
}

export function PayUPaymentForm({ payuData, payuUrl }: PayUPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto-submit the form when component mounts
    if (formRef.current) {
      try {
        setIsSubmitting(true)
        formRef.current.submit()
      } catch (err) {
        console.error("Error submitting form:", err)
        setError("Failed to redirect to payment gateway. Please try again.")
        setIsSubmitting(false)
      }
    }
  }, [])

  const handleManualSubmit = () => {
    if (formRef.current) {
      try {
        setIsSubmitting(true)
        setError(null)
        formRef.current.submit()
      } catch (err) {
        console.error("Error submitting form:", err)
        setError("Failed to redirect to payment gateway. Please try again.")
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Redirecting to PayU</h2>
        <p className="text-gray-500">Please wait while we redirect you to the payment gateway...</p>
      </div>

      <form ref={formRef} action={payuUrl} method="post" className="hidden">
        {Object.entries(payuData).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>

      <p className="text-sm text-gray-400 mt-6">
        If you are not automatically redirected, please click the button below.
      </p>
      <button
        onClick={handleManualSubmit}
        disabled={isSubmitting}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
            Redirecting...
          </>
        ) : (
          "Proceed to Payment"
        )}
      </button>
    </div>
  )
}
