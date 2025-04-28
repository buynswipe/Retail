"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <WifiOff className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            It seems you're not connected to the internet. Some features may be limited until you're back online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-100 p-4">
            <h3 className="mb-2 font-medium">What you can do:</h3>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>Check your internet connection</li>
              <li>View previously loaded data</li>
              <li>Create orders that will sync when you're back online</li>
              <li>Browse your local product catalog</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Wifi className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
