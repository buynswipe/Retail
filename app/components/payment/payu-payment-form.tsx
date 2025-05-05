"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

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

  useEffect(() => {
    // Auto-submit the form when component mounts
    if (formRef.current) {
      formRef.current.submit()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
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
        onClick={() => formRef.current?.submit()}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Proceed to Payment
      </button>
    </div>
  )
}
