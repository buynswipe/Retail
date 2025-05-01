"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeliveryAnalytics } from "@/app/components/analytics/delivery-analytics"
import ProtectedRoute from "@/app/components/protected-route"
import Navbar from "@/app/components/navbar"

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("sales")

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="sales" className="text-lg py-3">
                  Sales
                </TabsTrigger>
                <TabsTrigger value="users" className="text-lg py-3">
                  Users
                </TabsTrigger>
                <TabsTrigger value="delivery" className="text-lg py-3">
                  Delivery
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-lg py-3">
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Sales Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Sales analytics content */}
                    <div className="h-96 flex items-center justify-center">
                      <p className="text-muted-foreground">Sales analytics content will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">User Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* User analytics content */}
                    <div className="h-96 flex items-center justify-center">
                      <p className="text-muted-foreground">User analytics content will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4">
                <DeliveryAnalytics />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Performance analytics content */}
                    <div className="h-96 flex items-center justify-center">
                      <p className="text-muted-foreground">Performance analytics content will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
