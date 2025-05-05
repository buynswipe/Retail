import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/app/components/navbar"
import { TranslationProvider } from "@/app/components/translation-provider"

export default function Loading() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-4 w-full mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {Array(2)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {Array(2)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[300px] w-full rounded-full" />
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
