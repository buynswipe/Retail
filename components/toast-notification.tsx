"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"

interface ToastNotificationProps {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
  duration?: number
}

export function ToastNotification({ message, type = "success", onClose, duration = 3000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow exit animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-500"
      case "error":
        return "bg-red-50 border-red-500"
      case "info":
      default:
        return "bg-blue-50 border-blue-500"
    }
  }

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-500"
      case "error":
        return "text-red-500"
      case "info":
      default:
        return "text-blue-500"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className={`h-5 w-5 ${getIconColor()}`} />
      case "error":
        return <X className={`h-5 w-5 ${getIconColor()}`} />
      case "info":
      default:
        return <Check className={`h-5 w-5 ${getIconColor()}`} />
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out
                ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      <div className={`flex items-center p-4 rounded-lg shadow-md border-l-4 ${getBackgroundColor()}`}>
        <div className="mr-3">{getIcon()}</div>
        <div className="font-medium">{message}</div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
