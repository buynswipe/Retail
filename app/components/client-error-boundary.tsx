"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ClientErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Client error boundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-center text-gray-900">Something went wrong</h2>
            <div className="mb-4 text-sm text-center text-gray-600">
              We encountered an error while loading this page.
            </div>
            {this.state.error && (
              <div className="p-3 mb-4 overflow-auto text-xs bg-gray-100 rounded max-h-32">
                <p className="font-mono text-red-600">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                Try again
              </Button>
              <Button onClick={() => (window.location.href = "/")}>Go to Home</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
