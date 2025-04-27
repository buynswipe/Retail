"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })

    // You could also log to an error reporting service here
    // reportError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
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
                  <p className="font-mono text-red-600">{this.state.error.toString()}</p>
                </div>
              )}
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
                <Button onClick={() => (window.location.href = "/")}>Go to Home</Button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
