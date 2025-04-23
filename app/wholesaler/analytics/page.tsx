"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { type DateRange, getAnalyticsDashboard, type AnalyticsDashboard } from "@/lib/analytics-service"
import {
  getSalesForecast,
  getInventoryForecast,
  getProductPerformancePredictions,
  type SalesForecast,
  type InventoryForecast,
  type PerformancePrediction,
} from "@/lib/predictive-analytics-service"
import { DateRangeSelector } from "@/app/components/date-range-selector"
import { SalesOverviewCard } from "@/app/components/sales-overview-card"
import { OrderMetricsCard } from "@/app/components/order-metrics-card"
import { ProductPerformanceCard } from "@/app/components/product-performance-card"
import { CustomerMetricsCard } from "@/app/components/customer-metrics-card"
import { DeliveryMetricsCard } from "@/app/components/delivery-metrics-card"
import { InventoryMetricsCard } from "@/app/components/inventory-metrics-card"
import { TaxMetricsCard } from "@/app/components/tax-metrics-card"
import { SalesForecastCard } from "@/app/components/sales-forecast-card"
import { InventoryForecastCard } from "@/app/components/inventory-forecast-card"
import { ProductPredictionCard } from "@/app/components/product-prediction-card"
import { ExportOptions } from "@/app/components/export-options"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function WholesalerAnalyticsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Predictive analytics states
  const [salesForecast, setSalesForecast] = useState<SalesForecast[]>([])
  const [inventoryForecast, setInventoryForecast] = useState<InventoryForecast[]>([])
  const [productPredictions, setProductPredictions] = useState<PerformancePrediction[]>([])
  const [isPredictiveLoading, setIsPredictiveLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, dateRange, startDate, endDate])

  useEffect(() => {
    if (analytics && activeTab === "predictive") {
      loadPredictiveData()
    }
  }, [analytics, activeTab])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const startDateStr = startDate ? startDate.toISOString().split("T")[0] : undefined
      const endDateStr = endDate ? endDate.toISOString().split("T")[0] : undefined

      const data = await getAnalyticsDashboard(user!.id, user!.role, dateRange, startDateStr, endDateStr)

      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPredictiveData = async () => {
    if (!analytics) return

    setIsPredictiveLoading(true)
    try {
      // Load sales forecast
      const forecast = await getSalesForecast(
        user!.id,
        user!.role,
        analytics.sales_overview.sales_by_date,
        30, // 30 days forecast
      )
      setSalesForecast(forecast)

      // Create a mock current stock object
      const mockCurrentStock: Record<string, number> = {}
      analytics.products.top_selling_products.forEach((product) => {
        mockCurrentStock[product.id] = Math.floor(Math.random() * 100) + 20 // Random stock between 20 and 120
      })

      // Load inventory forecast
      const invForecast = await getInventoryForecast(
        user!.id,
        user!.role,
        analytics.products.top_selling_products,
        mockCurrentStock,
      )
      setInventoryForecast(invForecast)

      // Load product performance predictions
      const prodPredictions = await getProductPerformancePredictions(
        user!.id,
        user!.role,
        analytics.products.top_selling_products,
      )
      setProductPredictions(prodPredictions)
    } catch (error) {
      console.error("Error loading predictive analytics data:", error)
    } finally {
      setIsPredictiveLoading(false)
    }
  }

  if (!user) {
    return <div>Please log in to view analytics</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wholesaler Analytics</h1>
          <p className="text-muted-foreground">Monitor your business performance and optimize your operations</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <DateRangeSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />

          {analytics && !isLoading && (
            <ExportOptions analytics={analytics} dateRange={dateRange} userRole={user.role} activeTab={activeTab} />
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="retailers">Retailers</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[300px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[300px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[300px]" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                <SalesOverviewCard
                  totalSales={analytics.sales_overview.total_sales}
                  salesGrowth={analytics.sales_overview.sales_growth}
                  averageOrderValue={analytics.sales_overview.average_order_value}
                  salesByDate={analytics.sales_overview.sales_by_date}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <OrderMetricsCard orderMetrics={analytics.orders} />
                <InventoryMetricsCard inventoryMetrics={analytics.products} />
                <CustomerMetricsCard customerMetrics={analytics.customers} />
              </div>
            </>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-2 h-[300px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[300px]" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                <SalesOverviewCard
                  totalSales={analytics.sales_overview.total_sales}
                  salesGrowth={analytics.sales_overview.sales_growth}
                  averageOrderValue={analytics.sales_overview.average_order_value}
                  salesByDate={analytics.sales_overview.sales_by_date}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <ProductPerformanceCard products={analytics.products.top_selling_products} />
                <TaxMetricsCard taxMetrics={analytics.tax} />
              </div>
            </>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <ProductPerformanceCard products={analytics.products.top_selling_products} />
              <InventoryMetricsCard inventoryMetrics={analytics.products} />
              <DeliveryMetricsCard deliveryMetrics={analytics.delivery} />
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="retailers" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <CustomerMetricsCard customerMetrics={analytics.customers} />
              <OrderMetricsCard orderMetrics={analytics.orders} />
              <DeliveryMetricsCard deliveryMetrics={analytics.delivery} />
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Predictive Analytics</AlertTitle>
            <AlertDescription>
              These predictions are based on historical data and statistical models. Actual results may vary.
            </AlertDescription>
          </Alert>

          {isPredictiveLoading || isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
            </div>
          ) : analytics && salesForecast.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                <SalesForecastCard
                  historicalSales={analytics.sales_overview.sales_by_date}
                  forecastData={salesForecast}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <InventoryForecastCard inventoryForecasts={inventoryForecast} />
                <ProductPredictionCard predictions={productPredictions} />
              </div>
            </>
          ) : (
            <div>Failed to load predictive analytics data</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
