// Types for analytics data
export interface SalesData {
  date: string
  amount: number
}

export interface ProductPerformance {
  id: string
  name: string
  total_sales: number
  quantity_sold: number
  average_rating: number
}

export interface CustomerMetrics {
  total_customers: number
  new_customers: number
  returning_customers: number
  average_order_value: number
}

export interface OrderMetrics {
  total_orders: number
  average_order_value: number
  order_statuses: {
    status: string
    count: number
  }[]
}

export interface DeliveryMetrics {
  total_deliveries: number
  on_time_deliveries: number
  delayed_deliveries: number
  average_delivery_time: number
}

export interface InventoryMetrics {
  total_products: number
  low_stock_products: number
  out_of_stock_products: number
  top_selling_products: ProductPerformance[]
}

export interface TaxMetrics {
  total_tax_collected: number
  tax_by_category: {
    category: string
    amount: number
  }[]
}

export interface AnalyticsDashboard {
  sales_overview: {
    total_sales: number
    sales_growth: number
    average_order_value: number
    sales_by_date: SalesData[]
  }
  orders: OrderMetrics
  customers: CustomerMetrics
  products: InventoryMetrics
  delivery: DeliveryMetrics
  tax: TaxMetrics
}

// Date range type
export type DateRange = "7d" | "30d" | "90d" | "1y" | "all" | "custom"

// Function to get analytics data
export async function getAnalyticsDashboard(
  userId: string,
  role: string,
  dateRange: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<AnalyticsDashboard | null> {
  try {
    // In a real implementation, this would make specific queries to Supabase
    // based on the user's role, date range, etc.

    // For now, we'll return mock data
    return getMockAnalyticsData(role, dateRange)
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    return null
  }
}

// Function to get sales data for a specific date range
export async function getSalesData(
  userId: string,
  role: string,
  dateRange: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<SalesData[]> {
  try {
    // In a real implementation, this would query the orders table
    // and aggregate sales data by date

    // For now, we'll return mock data
    return getMockSalesData(dateRange)
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return []
  }
}

// Function to get top selling products
export async function getTopSellingProducts(
  userId: string,
  role: string,
  limit = 5,
  dateRange: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<ProductPerformance[]> {
  try {
    // In a real implementation, this would query the order_items table
    // and join with products to get the top selling products

    // For now, we'll return mock data
    return getMockTopSellingProducts(limit)
  } catch (error) {
    console.error("Error fetching top selling products:", error)
    return []
  }
}

// Function to get order status distribution
export async function getOrderStatusDistribution(
  userId: string,
  role: string,
  dateRange: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<{ status: string; count: number }[]> {
  try {
    // In a real implementation, this would query the orders table
    // and count orders by status

    // For now, we'll return mock data
    return [
      { status: "placed", count: 25 },
      { status: "confirmed", count: 18 },
      { status: "dispatched", count: 12 },
      { status: "delivered", count: 45 },
      { status: "cancelled", count: 5 },
    ]
  } catch (error) {
    console.error("Error fetching order status distribution:", error)
    return []
  }
}

// Function to get customer acquisition data
export async function getCustomerAcquisition(
  userId: string,
  role: string,
  dateRange: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<{ date: string; new_customers: number }[]> {
  try {
    // In a real implementation, this would query the users table
    // and count new users by date

    // For now, we'll return mock data
    return getMockCustomerAcquisitionData(dateRange)
  } catch (error) {
    console.error("Error fetching customer acquisition data:", error)
    return []
  }
}

// Helper function to generate mock sales data
function getMockSalesData(dateRange: DateRange): SalesData[] {
  const data: SalesData[] = []
  const now = new Date()
  let days = 30

  switch (dateRange) {
    case "7d":
      days = 7
      break
    case "30d":
      days = 30
      break
    case "90d":
      days = 90
      break
    case "1y":
      days = 365
      break
    case "all":
      days = 365 * 2
      break
    default:
      days = 30
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate a somewhat realistic sales pattern with weekends having higher sales
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseAmount = Math.floor(Math.random() * 5000) + 3000
    const amount = isWeekend ? baseAmount * 1.5 : baseAmount

    data.push({
      date: date.toISOString().split("T")[0],
      amount: Math.round(amount),
    })
  }

  return data
}

// Helper function to generate mock top selling products
function getMockTopSellingProducts(limit: number): ProductPerformance[] {
  const products = [
    {
      id: "1",
      name: "Parle-G Biscuits (Pack of 10)",
      total_sales: 25000,
      quantity_sold: 500,
      average_rating: 4.8,
    },
    {
      id: "2",
      name: "Tata Salt 1kg",
      total_sales: 18000,
      quantity_sold: 450,
      average_rating: 4.7,
    },
    {
      id: "3",
      name: "Maggi Noodles (Pack of 12)",
      total_sales: 15000,
      quantity_sold: 300,
      average_rating: 4.5,
    },
    {
      id: "4",
      name: "Aashirvaad Atta 5kg",
      total_sales: 12000,
      quantity_sold: 150,
      average_rating: 4.6,
    },
    {
      id: "5",
      name: "Surf Excel Detergent 1kg",
      total_sales: 10000,
      quantity_sold: 200,
      average_rating: 4.4,
    },
    {
      id: "6",
      name: "Colgate Toothpaste (Pack of 4)",
      total_sales: 9000,
      quantity_sold: 180,
      average_rating: 4.3,
    },
    {
      id: "7",
      name: "Britannia Good Day Biscuits",
      total_sales: 8500,
      quantity_sold: 170,
      average_rating: 4.2,
    },
    {
      id: "8",
      name: "Lifebuoy Soap (Pack of 6)",
      total_sales: 8000,
      quantity_sold: 160,
      average_rating: 4.1,
    },
    {
      id: "9",
      name: "Amul Butter 500g",
      total_sales: 7500,
      quantity_sold: 150,
      average_rating: 4.9,
    },
    {
      id: "10",
      name: "Clinic Plus Shampoo 500ml",
      total_sales: 7000,
      quantity_sold: 140,
      average_rating: 4.0,
    },
  ]

  return products.slice(0, limit)
}

// Helper function to generate mock customer acquisition data
function getMockCustomerAcquisitionData(dateRange: DateRange): { date: string; new_customers: number }[] {
  const data: { date: string; new_customers: number }[] = []
  const now = new Date()
  let days = 30

  switch (dateRange) {
    case "7d":
      days = 7
      break
    case "30d":
      days = 30
      break
    case "90d":
      days = 90
      break
    case "1y":
      days = 365
      break
    case "all":
      days = 365 * 2
      break
    default:
      days = 30
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate a somewhat realistic customer acquisition pattern
    const baseCustomers = Math.floor(Math.random() * 5) + 1

    data.push({
      date: date.toISOString().split("T")[0],
      new_customers: baseCustomers,
    })
  }

  return data
}

// Helper function to generate mock analytics dashboard data
function getMockAnalyticsData(role: string, dateRange: DateRange): AnalyticsDashboard {
  // Generate sales data
  const salesByDate = getMockSalesData(dateRange)
  const totalSales = salesByDate.reduce((sum, item) => sum + item.amount, 0)

  // Generate order metrics
  const totalOrders = Math.floor(totalSales / 2000)
  const averageOrderValue = Math.round(totalSales / totalOrders)

  // Generate customer metrics
  const totalCustomers = Math.floor(totalOrders * 0.7)
  const newCustomers = Math.floor(totalCustomers * 0.3)
  const returningCustomers = totalCustomers - newCustomers

  // Generate product metrics
  const topSellingProducts = getMockTopSellingProducts(5)

  // Generate delivery metrics
  const totalDeliveries = Math.floor(totalOrders * 0.9)
  const onTimeDeliveries = Math.floor(totalDeliveries * 0.85)
  const delayedDeliveries = totalDeliveries - onTimeDeliveries

  // Generate tax metrics
  const totalTaxCollected = Math.round(totalSales * 0.18)

  return {
    sales_overview: {
      total_sales: totalSales,
      sales_growth: 12.5,
      average_order_value: averageOrderValue,
      sales_by_date: salesByDate,
    },
    orders: {
      total_orders: totalOrders,
      average_order_value: averageOrderValue,
      order_statuses: [
        { status: "placed", count: Math.floor(totalOrders * 0.1) },
        { status: "confirmed", count: Math.floor(totalOrders * 0.15) },
        { status: "dispatched", count: Math.floor(totalOrders * 0.2) },
        { status: "delivered", count: Math.floor(totalOrders * 0.5) },
        { status: "cancelled", count: Math.floor(totalOrders * 0.05) },
      ],
    },
    customers: {
      total_customers: totalCustomers,
      new_customers: newCustomers,
      returning_customers: returningCustomers,
      average_order_value: averageOrderValue,
    },
    products: {
      total_products: 100,
      low_stock_products: 15,
      out_of_stock_products: 5,
      top_selling_products: topSellingProducts,
    },
    delivery: {
      total_deliveries: totalDeliveries,
      on_time_deliveries: onTimeDeliveries,
      delayed_deliveries: delayedDeliveries,
      average_delivery_time: 36, // hours
    },
    tax: {
      total_tax_collected: totalTaxCollected,
      tax_by_category: [
        { category: "CGST", amount: totalTaxCollected / 2 },
        { category: "SGST", amount: totalTaxCollected / 2 },
      ],
    },
  }
}
