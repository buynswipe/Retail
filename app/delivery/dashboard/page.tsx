"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Truck, Package, FileText, CreditCard, BarChart4 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

function DeliveryDashboardContent() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Delivery Partner Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button asChild className="h-24 flex flex-col bg-blue-500 hover:bg-blue-600">
          <Link href="/delivery/assignments">
            <Package className="h-8 w-8 mb-2" />
            <span>Find Assignments</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-green-500 hover:bg-green-600">
          <Link href="/delivery/active">
            <Truck className="h-8 w-8 mb-2" />
            <span>Active Deliveries</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-orange-500 hover:bg-orange-600">
          <Link href="/chat">
            <Package className="h-8 w-8 mb-2" />
            <span>Chat</span>
          </Link>
        </Button>
        <Button asChild className="h-24 flex flex-col bg-purple-500 hover:bg-purple-600">
          <Link href="/delivery/history">
            <FileText className="h-8 w-8 mb-2" />
            <span>History</span>
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Deliveries</p>
                <h3 className="text-3xl font-bold">0</h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
                <h3 className="text-3xl font-bold">₹0</h3>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Distance</p>
                <h3 className="text-3xl font-bold">0 km</h3>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Performance</div>
            <p className="text-xs text-muted-foreground">Track earnings and deliveries</p>
          </CardContent>
          <CardFooter>
            <Link href="/delivery/analytics" className="w-full">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Welcome Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome, {user?.name || "Delivery Partner"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">
            Start finding delivery assignments in your area and earn money for each successful delivery.
          </p>
          <Button asChild className="bg-blue-500 hover:bg-blue-600">
            <Link href="/delivery/assignments">Find Assignments</Link>
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Package className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Find Assignments</h3>
              <p>Browse available delivery assignments in your area</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <Truck className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Deliver</h3>
              <p>Pick up from wholesaler and deliver to retailer</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <CreditCard className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Paid</h3>
              <p>Earn money for each successful delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DeliveryDashboard() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <DeliveryDashboardContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
