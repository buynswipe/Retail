"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { type DateRange, getAnalyticsDashboard, type AnalyticsDashboard } from "@/lib/analytics-service"
import { DateRangeSelector } from "@/app/components/date-range-selector"
import { SalesOverviewCard } from "@/app/components/sales-overview-card"
import { OrderMetricsCard } from "@/app/components/order-metrics-card"
import { ProductPerformanceCard } from "@/app/components/product-performance-card"
import { CustomerMetricsCard } from "@/app/components/customer-metrics-card"
import { DeliveryMetricsCard } from "@/app/components/delivery-metrics-card"
import { InventoryMetricsCard } from "@/app/components/inventory-metrics-card"
import { TaxMetricsCard } from "@/app/components/tax-metrics-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function RetailerAnalyticsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, dateRange, startDate, endDate])

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

  if (!user) {
    return <div>Please log in to view analytics</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and make data-driven decisions</p>
        </div>

        <DateRangeSelector
          dateRange={dateRange}
          setDateRange={setDateRange}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[300px]" />
              <Skeleton className="col-span-3 md:col-span-2 h-[300px]" />
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
                <ProductPerformanceCard products={analytics.products.top_selling_products} />
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
                <TaxMetricsCard taxMetrics={analytics.tax} />
                <DeliveryMetricsCard deliveryMetrics={analytics.delivery} />
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
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="col-span-3 md:col-span-2 h-[400px]" />
              <Skeleton className="col-span-3 md:col-span-1 h-[400px]" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-3 gap-6">
              <SalesOverviewCard
                totalSales={analytics.sales_overview.total_sales}
                salesGrowth={analytics.sales_overview.sales_growth}
                averageOrderValue={analytics.sales_overview.average_order_value}
                salesByDate={analytics.sales_overview.sales_by_date}
              />
              <CustomerMetricsCard customerMetrics={analytics.customers} />
            </div>
          ) : (
            <div>Failed to load analytics data</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
