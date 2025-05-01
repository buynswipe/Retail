import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle>
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="mb-8">
        <Skeleton className="h-12 w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-80" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <div className="grid grid-cols-6 gap-4 mb-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
              </div>

              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 mb-4">
                    {Array(6)
                      .fill(0)
                      .map((_, j) => (
                        <Skeleton key={j} className="h-10" />
                      ))}
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
