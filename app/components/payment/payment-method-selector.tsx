"use client"

import type React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CreditCard, Wallet, Landmark, CheckCircle } from "lucide-react"

export type PaymentMethodOption = {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethodOption[]
  selectedMethod: string
  onMethodChange: (method: string) => void
}

export function PaymentMethodSelector({ methods, selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup value={selectedMethod} onValueChange={onMethodChange} className="space-y-3">
      {methods.map((method) => (
        <div key={method.id} className={`relative ${method.disabled ? "opacity-60" : ""}`}>
          <RadioGroupItem
            value={method.id}
            id={`payment-${method.id}`}
            className="peer sr-only"
            disabled={method.disabled}
          />
          <Label
            htmlFor={`payment-${method.id}`}
            className="flex items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
                {method.icon || <CreditCard className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium">{method.name}</p>
                {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
              </div>
            </div>
            <CheckCircle
              className={`h-5 w-5 ${
                selectedMethod === method.id ? "text-primary opacity-100" : "text-muted opacity-0"
              } transition-opacity`}
            />
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

export function DefaultPaymentMethods({
  selectedMethod,
  onMethodChange,
}: {
  selectedMethod: string
  onMethodChange: (method: string) => void
}) {
  const CashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="12" x="3" y="6" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 10h4" />
      <path d="M3 14h4" />
      <path d="M17 10h4" />
      <path d="M17 14h4" />
    </svg>
  )

  const methods: PaymentMethodOption[] = [
    {
      id: "payu",
      name: "PayU",
      description: "Credit/Debit Card, UPI, Net Banking",
      icon: (
        <div className="relative w-6 h-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        </div>
      ),
    },
    {
      id: "upi",
      name: "UPI",
      description: "Google Pay, PhonePe, Paytm",
      icon: <Wallet className="h-6 w-6" />,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "All major banks supported",
      icon: <Landmark className="h-6 w-6" />,
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when you receive your order",
      icon: <CashIcon />,
    },
  ]

  return <PaymentMethodSelector methods={methods} selectedMethod={selectedMethod} onMethodChange={onMethodChange} />
}

export function SavedPaymentMethods({
  savedMethods,
  selectedMethod,
  onMethodChange,
  onAddNewMethod,
}: {
  savedMethods: any[]
  selectedMethod: string
  onMethodChange: (method: string) => void
  onAddNewMethod: () => void
}) {
  if (!savedMethods || savedMethods.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 mb-4">You don't have any saved payment methods.</p>
        <button
          onClick={onAddNewMethod}
          className="text-blue-500 hover:text-blue-700 font-medium flex items-center justify-center mx-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add Payment Method
        </button>
      </Card>
    )
  }

  const methods: PaymentMethodOption[] = savedMethods.map((method) => ({
    id: method.id,
    name: getMethodDisplayName(method),
    description: getMethodDescription(method),
    icon: getMethodIcon(method),
  }))

  // Add "Add new method" option
  methods.push({
    id: "add_new",
    name: "Add New Payment Method",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  })

  return (
    <RadioGroup
      value={selectedMethod}
      onValueChange={(value) => {
        if (value === "add_new") {
          onAddNewMethod()
        } else {
          onMethodChange(value)
        }
      }}
      className="space-y-3"
    >
      {methods.map((method) => (
        <div key={method.id} className={`relative ${method.disabled ? "opacity-60" : ""}`}>
          <RadioGroupItem
            value={method.id}
            id={`payment-${method.id}`}
            className="peer sr-only"
            disabled={method.disabled}
          />
          <Label
            htmlFor={`payment-${method.id}`}
            className="flex items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
                {method.icon || <CreditCard className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium">{method.name}</p>
                {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
              </div>
            </div>
            {method.id !== "add_new" && (
              <CheckCircle
                className={`h-5 w-5 ${
                  selectedMethod === method.id ? "text-primary opacity-100" : "text-muted opacity-0"
                } transition-opacity`}
              />
            )}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

// Helper functions for saved payment methods
function getMethodDisplayName(method: any): string {
  switch (method.type) {
    case "card":
      return `${method.card_network} •••• ${method.last4}`
    case "upi":
      return `UPI - ${method.upi_id}`
    case "netbanking":
      return `${method.bank_name} Bank`
    default:
      return method.name || "Payment Method"
  }
}

function getMethodDescription(method: any): string {
  switch (method.type) {
    case "card":
      return `Expires ${method.expiry_month}/${method.expiry_year}`
    case "upi":
      return method.upi_app || "UPI Payment"
    case "netbanking":
      return "Net Banking"
    default:
      return method.description || ""
  }
}

function getMethodIcon(method: any): React.ReactNode {
  switch (method.type) {
    case "card":
      return getCardIcon(method.card_network)
    case "upi":
      return getUpiIcon(method.upi_app)
    case "netbanking":
      return <Landmark className="h-6 w-6" />
    default:
      return <CreditCard className="h-6 w-6" />
  }
}

function getCardIcon(network?: string): React.ReactNode {
  switch (network?.toLowerCase()) {
    case "visa":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    case "mastercard":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
  }
}

function getUpiIcon(app?: string): React.ReactNode {
  return <Wallet className="h-6 w-6" />
}
