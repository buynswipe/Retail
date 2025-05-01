"use client"

import { AlertCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  variant?: "default" | "destructive"
}

export function ErrorAlert({ title = "Error", message, onRetry, variant = "destructive" }: ErrorAlertProps) {
  return (
    <Alert variant={variant} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <XCircle className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
