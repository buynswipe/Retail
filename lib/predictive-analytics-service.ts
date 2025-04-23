import type { SalesData, ProductPerformance } from "./analytics-service"

// Types for predictive analytics
export interface SalesForecast {
  date: string
  predicted_amount: number
  lower_bound: number
  upper_bound: number
}

export interface InventoryForecast {
  product_id: string
  product_name: string
  current_stock: number
  predicted_demand: number
  recommended_reorder: boolean
  days_until_stockout: number
}

export interface CustomerForecast {
  date: string
  predicted_new_customers: number
  predicted_returning_customers: number
}

export interface PerformancePrediction {
  product_id: string
  product_name: string
  current_sales: number
  predicted_sales: number
  growth_percentage: number
  trend: "up" | "down" | "stable"
}

// Function to get sales forecast
export async function getSalesForecast(
  userId: string,
  role: string,
  historicalSales: SalesData[],
  daysToForecast = 30,
): Promise<SalesForecast[]> {
  try {
    // In a real implementation, this would use a time series forecasting algorithm
    // like ARIMA, exponential smoothing, or a machine learning model

    // For now, we'll use a simple moving average with some randomness
    return generateMockSalesForecast(historicalSales, daysToForecast)
  } catch (error) {
    console.error("Error generating sales forecast:", error)
    return []
  }
}

// Function to get inventory forecast
export async function getInventoryForecast(
  userId: string,
  role: string,
  products: ProductPerformance[],
  currentStock: Record<string, number>,
): Promise<InventoryForecast[]> {
  try {
    // In a real implementation, this would analyze historical sales patterns
    // and current inventory levels to predict future stock needs

    // For now, we'll generate mock data
    return generateMockInventoryForecast(products, currentStock)
  } catch (error) {
    console.error("Error generating inventory forecast:", error)
    return []
  }
}

// Function to get product performance predictions
export async function getProductPerformancePredictions(
  userId: string,
  role: string,
  products: ProductPerformance[],
): Promise<PerformancePrediction[]> {
  try {
    // In a real implementation, this would analyze historical product performance
    // and market trends to predict future performance

    // For now, we'll generate mock data
    return generateMockProductPredictions(products)
  } catch (error) {
    console.error("Error generating product performance predictions:", error)
    return []
  }
}

// Helper function to generate mock sales forecast
function generateMockSalesForecast(historicalSales: SalesData[], daysToForecast: number): SalesForecast[] {
  const forecast: SalesForecast[] = []

  // Calculate average and standard deviation of recent sales
  const recentSales = historicalSales.slice(-14) // Last 14 days
  const avgSales = recentSales.reduce((sum, day) => sum + day.amount, 0) / recentSales.length

  // Calculate standard deviation
  const variance = recentSales.reduce((sum, day) => sum + Math.pow(day.amount - avgSales, 2), 0) / recentSales.length
  const stdDev = Math.sqrt(variance)

  // Generate forecast
  const lastDate = historicalSales.length > 0 ? new Date(historicalSales[historicalSales.length - 1].date) : new Date()

  for (let i = 1; i <= daysToForecast; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    // Add some trend and seasonality
    const dayOfWeek = forecastDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const seasonalFactor = isWeekend ? 1.2 : 1.0

    // Add a slight upward trend
    const trendFactor = 1 + i * 0.005

    // Calculate predicted amount with some randomness
    const randomFactor = 0.9 + Math.random() * 0.2 // Between 0.9 and 1.1
    const predictedAmount = avgSales * seasonalFactor * trendFactor * randomFactor

    // Calculate confidence interval
    const lowerBound = Math.max(0, predictedAmount - stdDev)
    const upperBound = predictedAmount + stdDev

    forecast.push({
      date: forecastDate.toISOString().split("T")[0],
      predicted_amount: Math.round(predictedAmount),
      lower_bound: Math.round(lowerBound),
      upper_bound: Math.round(upperBound),
    })
  }

  return forecast
}

// Helper function to generate mock inventory forecast
function generateMockInventoryForecast(
  products: ProductPerformance[],
  currentStock: Record<string, number>,
): InventoryForecast[] {
  return products.map((product) => {
    // Estimate daily sales rate based on total sales and quantity
    const dailySalesRate = product.quantity_sold / 30 // Assuming data is for 30 days

    // Get current stock or use a random number if not provided
    const stock = currentStock[product.id] || Math.floor(Math.random() * 100) + 20

    // Calculate days until stockout
    const daysUntilStockout = Math.floor(stock / dailySalesRate)

    // Determine if reorder is recommended (if less than 14 days of stock left)
    const recommendedReorder = daysUntilStockout < 14

    return {
      product_id: product.id,
      product_name: product.name,
      current_stock: stock,
      predicted_demand: Math.ceil(dailySalesRate * 30), // Predicted demand for next 30 days
      recommended_reorder,
      days_until_stockout: daysUntilStockout,
    }
  })
}

// Helper function to generate mock product performance predictions
function generateMockProductPredictions(products: ProductPerformance[]): PerformancePrediction[] {
  return products.map((product) => {
    // Generate a random growth percentage between -15% and +30%
    const growthPercentage = Math.random() * 45 - 15

    // Calculate predicted sales based on growth
    const predictedSales = product.total_sales * (1 + growthPercentage / 100)

    // Determine trend
    let trend: "up" | "down" | "stable"
    if (growthPercentage > 5) trend = "up"
    else if (growthPercentage < -5) trend = "down"
    else trend = "stable"

    return {
      product_id: product.id,
      product_name: product.name,
      current_sales: product.total_sales,
      predicted_sales: Math.round(predictedSales),
      growth_percentage: Math.round(growthPercentage * 10) / 10, // Round to 1 decimal place
      trend,
    }
  })
}
