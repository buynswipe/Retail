"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/app/components/translation-provider"
import Navbar from "@/app/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getLowStockProducts, getExpiringBatches } from "@/lib/inventory-service"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Package,
  Search,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  X,
  Plus,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function InventoryDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [expiringBatches, setExpiringBatches] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("low-stock")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInventoryAlerts = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Load low stock products
        const { data: lowStockData, error: lowStockError } = await getLowStockProducts(user.id)
        if (lowStockError) throw lowStockError
        setLowStockProducts(lowStockData || [])

        // Load expiring batches
        const { data: expiringData, error: expiringError } = await getExpiringBatches(user.id)
        if (expiringError) throw expiringError
        setExpiringBatches(expiringData || [])
      } catch (error) {
        console.error("Failed to load inventory alerts:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory alerts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInventoryAlerts()
  }, [user])

  // Filter products based on search query
  const filteredLowStockProducts = lowStockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredExpiringBatches = expiringBatches.filter((batch) =>
    batch.product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t("Inventory Dashboard")}</h1>
            <Button asChild>
              <Link href="/wholesaler/inventory">
                <Package className="mr-2 h-5 w-5" />
                {t("View All Inventory")}
              </Link>
            </Button>
          </div>

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Total Products")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">{lowStockProducts.length + expiringBatches.length}</div>
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Low Stock Items")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">{lowStockProducts.length}</div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{t("Expiring Soon")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-bold">{expiringBatches.length}</div>
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Alerts */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold">{t("Inventory Alerts")}</h2>
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={t("Search products...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 w-full md:w-[300px]"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="low-stock" className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t("Low Stock")}
                </TabsTrigger>
                <TabsTrigger value="expiring" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("Expiring Soon")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">{t("Loading inventory alerts...")}</p>
              </div>
            ) : activeTab === "low-stock" ? (
              <div className="space-y-4">
                {filteredLowStockProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg text-gray-500">
                      {searchQuery ? t("No low stock products match your search") : t("No low stock products found")}
                    </p>
                  </div>
                ) : (
                  filteredLowStockProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                              <p>
                                {t("Category")}: {product.category || t("Uncategorized")}
                              </p>
                              <p>
                                {t("Price")}: {formatCurrency(product.price)}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <Badge variant="outline" className="bg-red-50 text-red-700 mb-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t("Low Stock")}
                            </Badge>
                            <p className="text-lg font-bold">
                              {product.stock_quantity} / {product.low_stock_threshold}
                            </p>
                            <p className="text-xs text-gray-500">{t("Current / Threshold")}</p>
                          </div>
                          <div>
                            <Button asChild>
                              <Link href={`/wholesaler/inventory/${product.id}`}>{t("Manage")}</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpiringBatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg text-gray-500">
                      {searchQuery ? t("No expiring batches match your search") : t("No expiring batches found")}
                    </p>
                  </div>
                ) : (
                  filteredExpiringBatches.map((batch) => (
                    <Card key={batch.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {batch.product.image_url ? (
                              <Image
                                src={batch.product.image_url || "/placeholder.svg"}
                                alt={batch.product.name}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{batch.product.name}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                              <p>
                                {t("Batch")}: {batch.batch_number}
                              </p>
                              <p>
                                {t("Quantity")}: {batch.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 mb-2">
                              <Clock className="h-3 w-3 mr-1" />
                              {t("Expiring Soon")}
                            </Badge>
                            <p className="text-sm font-medium">{formatDate(batch.expiry_date)}</p>
                            <p className="text-xs text-gray-500">{t("Expiry Date")}</p>
                          </div>
                          <div>
                            <Button asChild>
                              <Link href={`/wholesaler/inventory/${batch.product_id}`}>{t("Manage")}</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Inventory Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">{t("Quick Actions")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <Link href="/wholesaler/inventory/add-stock">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium mb-2">{t("Add New Stock")}</h3>
                    <p className="text-sm text-gray-500">
                      {t("Add new stock or create a new batch for existing products")}
                    </p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <Link href="/wholesaler/products/new">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium mb-2">{t("Add New Product")}</h3>
                    <p className="text-sm text-gray-500">{t("Create a new product in your inventory")}</p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <Link href="/wholesaler/inventory/reports">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium mb-2">{t("Inventory Reports")}</h3>
                    <p className="text-sm text-gray-500">{t("View detailed reports about your inventory movements")}</p>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>

          {/* Inventory Trends */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">{t("Inventory Trends")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    {t("Top Selling Products")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-4 text-gray-500">{t("Loading...")}</p>
                  ) : (
                    <div className="space-y-4">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url || "/placeholder.svg"}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(product.price)} / {product.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {Math.floor(Math.random() * 100)} {t("sold")}
                            </p>
                            <p className="text-sm text-green-500">+{Math.floor(Math.random() * 20)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                    {t("Slow Moving Products")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-4 text-gray-500">{t("Loading...")}</p>
                  ) : (
                    <div className="space-y-4">
                      {lowStockProducts
                        .slice(0, 5)
                        .reverse()
                        .map((product) => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden">
                                {product.image_url ? (
                                  <Image
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(product.price)} / {product.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {Math.floor(Math.random() * 10)} {t("sold")}
                              </p>
                              <p className="text-sm text-red-500">-{Math.floor(Math.random() * 15)}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
