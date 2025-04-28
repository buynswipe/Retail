"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, Truck, Package, XCircle } from "lucide-react"
import type { OrderStatus } from "@/lib/types"

interface OrderTrackingProps {
  status: OrderStatus
  createdAt: string
  processedAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

export default function OrderTracking({
  status,
  createdAt,
  processedAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: OrderTrackingProps) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    switch (status) {
      case "PENDING":
        setActiveStep(0)
        break
      case "PROCESSING":
        setActiveStep(1)
        break
      case "SHIPPED":
        setActiveStep(2)
        break
      case "DELIVERED":
        setActiveStep(3)
        break
      case "CANCELLED":
        setActiveStep(-1)
        break
      default:
        setActiveStep(0)
    }
  }, [status])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "CANCELLED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <XCircle className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Order Cancelled</h3>
            <p className="text-sm text-red-600">
              {cancelledAt ? `Cancelled on ${formatDate(cancelledAt)}` : "This order has been cancelled"}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          If you have any questions about this cancellation, please contact customer support.
        </p>
      </div>
    )
  }

  const steps = [
    {
      title: "Order Placed",
      description: `Your order has been received`,
      icon: <Clock className="h-6 w-6" />,
      date: formatDate(createdAt),
    },
    {
      title: "Processing",
      description: "Your order is being processed",
      icon: <Package className="h-6 w-6" />,
      date: formatDate(processedAt),
    },
    {
      title: "Shipped",
      description: "Your order is on the way",
      icon: <Truck className="h-6 w-6" />,
      date: formatDate(shippedAt),
    },
    {
      title: "Delivered",
      description: "Your order has been delivered",
      icon: <CheckCircle className="h-6 w-6" />,
      date: formatDate(deliveredAt),
    },
  ]

  return (
    <div className="py-4">
      <h3 className="text-lg font-medium mb-6">Order Status</h3>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200" />

        {steps.map((step, index) => {
          const isActive = index <= activeStep
          const isPast = index < activeStep

          return (
            <div key={index} className="relative flex items-start mb-8 last:mb-0">
              {/* Step indicator */}
              <div
                className={`z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isActive ? "bg-primary border-primary text-white" : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {step.icon}
              </div>

              {/* Step content */}
              <div className="ml-4">
                <h4 className={`text-base font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                  {step.title}
                </h4>
                <p className={`text-sm ${isActive ? "text-gray-600" : "text-gray-400"}`}>{step.description}</p>
                {step.date && (
                  <p className={`text-xs mt-1 ${isActive ? "text-gray-500" : "text-gray-400"}`}>{step.date}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
