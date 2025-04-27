import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, AlertCircle, CheckCircle } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Skeleton className="h-20 w-full mb-6" />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            All Migrations
            <Skeleton className="h-5 w-8 ml-2" />
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending
            <Skeleton className="h-5 w-8 ml-2" />
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Applied
            <Skeleton className="h-5 w-8 ml-2" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="h-20 w-full mb-2" />
                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
