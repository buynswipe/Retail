import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <h1 className="text-3xl font-bold">Notifications</h1>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  All Notifications
                </CardTitle>
                <Skeleton className="h-9 w-36" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pt-2">
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="mt-4 divide-y">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="p-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/3 mb-2" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
