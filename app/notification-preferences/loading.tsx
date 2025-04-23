import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "../components/navbar"
import { Bell, ArrowLeft } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Notification Preferences</h1>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Customize which notifications you want to receive and how you want to receive them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-60" />
                          </div>
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <div className="space-y-4">
                    {Array(2)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-60" />
                          </div>
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
