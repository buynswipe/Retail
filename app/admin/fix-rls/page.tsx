"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function FixRLSPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const applyRLSPolicies = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup-rls")
      const data = await response.json()

      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Fix RLS Policies</CardTitle>
          <CardDescription>Apply the correct Row Level Security policies to fix permission issues</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This tool will apply the correct RLS policies to the users table to fix the "permission denied for table
            users" error.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message || result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={applyRLSPolicies} disabled={isLoading} className="w-full">
            {isLoading ? "Applying Policies..." : "Apply RLS Policies"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
