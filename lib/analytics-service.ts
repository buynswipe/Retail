import { supabase } from "./supabase-client"
import { type DateRange, dateRangeToSupabaseFilter, generateForecast } from "./analytics-utils"

// Get order analytics with advanced filtering
export async function getOrderAnalytics(
  timeframe = "week",
  dateRange?: DateRange,
  filters?: {
    region?: string
    productCategory?: string
    paymentMethod?: string
  },
) {
  try {
    let timeFilter = ""

    if (dateRange) {
      timeFilter = dateRangeToSupabaseFilter(dateRange)
    } else {
      switch (timeframe) {
        case "day":
          timeFilter = "created_at > now() - interval '1 day'"
          break
        case "week":
          timeFilter = "created_at > now() - interval '7 days'"
          break
        case "month":
          timeFilter = "created_at > now() - interval '30 days'"
          break
        case "year":
          timeFilter = "created_at > now() - interval '365 days'"
          break
        default:
          timeFilter = "created_at > now() - interval '7 days'"
      }
    }

    // Build additional filters
    const additionalFilters: Record<string, any> = {}

    if (filters?.region) {
      additionalFilters.region = filters.region
    }

    if (filters?.paymentMethod) {
      additionalFilters.payment_method = filters.paymentMethod
    }

    // Get total orders
    let query = supabase.from("orders").select("*", { count: "exact", head: true }).filter(timeFilter, {})

    // Apply additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    // Apply product category filter if provided
    if (filters?.productCategory) {
      query = query.in(
        "id",
        supabase
          .from("order_items")
          .select("order_id")
          .in("product_id", supabase.from("products").select("id").eq("category", filters.productCategory)),
      )
    }

    const { count: totalOrders, error: totalOrdersError } = await query

    if (totalOrdersError) throw totalOrdersError

    // Get orders by status with filters
    const { data: ordersByStatus, error: ordersByStatusError } = await supabase.rpc(
      "get_orders_by_status_with_filters",
      {
        timeframe_filter: timeframe,
        date_range_start: dateRange?.startDate.toISOString(),
        date_range_end: dateRange?.endDate.toISOString(),
        region_filter: filters?.region || null,
        product_category_filter: filters?.productCategory || null,
        payment_method_filter: filters?.paymentMethod || null,
      },
    )

    if (ordersByStatusError) throw ordersByStatusError

    // Get orders by day with filters
    const { data: ordersByDay, error: ordersByDayError } = await supabase.rpc("get_orders_by_day_with_filters", {
      timeframe_filter: timeframe,
      date_range_start: dateRange?.startDate.toISOString(),
      date_range_end: dateRange?.endDate.toISOString(),
      region_filter: filters?.region || null,
      product_category_filter: filters?.productCategory || null,
      payment_method_filter: filters?.paymentMethod || null,
    })

    if (ordersByDayError) throw ordersByDayError

    // Generate order forecast
    const orderForecast = generateForecast(
      (ordersByDay || []).map((item) => ({
        date: item.date,
        value: item.count,
      })),
      14, // Forecast for next 14 days
    )

    return {
      totalOrders,
      ordersByStatus: ordersByStatus || [],
      ordersByDay: ordersByDay || [],
      orderForecast,
    }
  } catch (error) {
    console.error("Error fetching order analytics:", error)
    throw error
  }
}

// Get revenue analytics with advanced filtering
export async function getRevenueAnalytics(
  timeframe = "week",
  dateRange?: DateRange,
  filters?: {
    region?: string
    productCategory?: string
    paymentMethod?: string
  },
) {
  try {
    let timeFilter = ""

    if (dateRange) {
      timeFilter = dateRangeToSupabaseFilter(dateRange)
    } else {
      switch (timeframe) {
        case "day":
          timeFilter = "created_at > now() - interval '1 day'"
          break
        case "week":
          timeFilter = "created_at > now() - interval '7 days'"
          break
        case "month":
          timeFilter = "created_at > now() - interval '30 days'"
          break
        case "year":
          timeFilter = "created_at > now() - interval '365 days'"
          break
        default:
          timeFilter = "created_at > now() - interval '7 days'"
      }
    }

    // Build additional filters
    const additionalFilters: Record<string, any> = {}

    if (filters?.region) {
      additionalFilters.region = filters.region
    }

    if (filters?.paymentMethod) {
      additionalFilters.payment_method = filters.paymentMethod
    }

    // Get total revenue with filters
    let query = supabase.from("payments").select("amount").filter(timeFilter, {}).eq("status", "completed")

    // Apply additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    // Apply product category filter if provided
    if (filters?.productCategory) {
      query = query.in(
        "order_id",
        supabase
          .from("order_items")
          .select("order_id")
          .in("product_id", supabase.from("products").select("id").eq("category", filters.productCategory)),
      )
    }

    const { data: totalRevenueData, error: totalRevenueError } = await query

    if (totalRevenueError) throw totalRevenueError

    const totalRevenue = totalRevenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    // Get revenue by day with filters
    const { data: revenueByDay, error: revenueByDayError } = await supabase.rpc("get_revenue_by_day_with_filters", {
      timeframe_filter: timeframe,
      date_range_start: dateRange?.startDate.toISOString(),
      date_range_end: dateRange?.endDate.toISOString(),
      region_filter: filters?.region || null,
      product_category_filter: filters?.productCategory || null,
      payment_method_filter: filters?.paymentMethod || null,
    })

    if (revenueByDayError) throw revenueByDayError

    // Generate revenue forecast
    const revenueForecast = generateForecast(
      (revenueByDay || []).map((item) => ({
        date: item.date,
        value: item.amount,
      })),
      14, // Forecast for next 14 days
    )

    return {
      totalRevenue,
      revenueByDay: revenueByDay || [],
      revenueForecast,
    }
  } catch (error) {
    console.error("Error fetching revenue analytics:", error)
    throw error
  }
}

// Get user analytics with advanced filtering
export async function getUserAnalytics(
  timeframe = "week",
  dateRange?: DateRange,
  filters?: {
    region?: string
    role?: string
  },
) {
  try {
    let timeFilter = ""

    if (dateRange) {
      timeFilter = dateRangeToSupabaseFilter(dateRange)
    } else {
      switch (timeframe) {
        case "day":
          timeFilter = "created_at > now() - interval '1 day'"
          break
        case "week":
          timeFilter = "created_at > now() - interval '7 days'"
          break
        case "month":
          timeFilter = "created_at > now() - interval '30 days'"
          break
        case "year":
          timeFilter = "created_at > now() - interval '365 days'"
          break
        default:
          timeFilter = "created_at > now() - interval '7 days'"
      }
    }

    // Build additional filters for total users
    const totalUsersFilters: Record<string, any> = {}

    if (filters?.region) {
      totalUsersFilters.region = filters.region
    }

    if (filters?.role) {
      totalUsersFilters.role = filters.role
    }

    // Get total users with filters
    let totalUsersQuery = supabase.from("users").select("*", { count: "exact", head: true })

    // Apply additional filters
    Object.entries(totalUsersFilters).forEach(([key, value]) => {
      totalUsersQuery = totalUsersQuery.eq(key, value)
    })

    const { count: totalUsers, error: totalUsersError } = await totalUsersQuery

    if (totalUsersError) throw totalUsersError

    // Build additional filters for new users
    const newUsersFilters: Record<string, any> = { ...totalUsersFilters }

    // Get new users with filters
    let newUsersQuery = supabase.from("users").select("*", { count: "exact", head: true }).filter(timeFilter, {})

    // Apply additional filters
    Object.entries(newUsersFilters).forEach(([key, value]) => {
      newUsersQuery = newUsersQuery.eq(key, value)
    })

    const { count: newUsers, error: newUsersError } = await newUsersQuery

    if (newUsersError) throw newUsersError

    // Get users by role with filters
    const { data: usersByRole, error: usersByRoleError } = await supabase.rpc("get_users_by_role_with_filters", {
      region_filter: filters?.region || null,
    })

    if (usersByRoleError) throw usersByRoleError

    // Get users by day with filters
    const { data: usersByDay, error: usersByDayError } = await supabase.rpc("get_users_by_day_with_filters", {
      timeframe_filter: timeframe,
      date_range_start: dateRange?.startDate.toISOString(),
      date_range_end: dateRange?.endDate.toISOString(),
      region_filter: filters?.region || null,
      role_filter: filters?.role || null,
    })

    if (usersByDayError) throw usersByDayError

    // Generate user growth forecast
    const userGrowthForecast = generateForecast(
      (usersByDay || []).map((item) => ({
        date: item.date,
        value: item.count,
      })),
      30, // Forecast for next 30 days
    )

    return {
      totalUsers,
      newUsers,
      usersByRole: usersByRole || [],
      usersByDay: usersByDay || [],
      userGrowthForecast,
    }
  } catch (error) {
    console.error("Error fetching user analytics:", error)
    throw error
  }
}

// Get product analytics with advanced filtering
export async function getProductAnalytics(
  timeframe = "week",
  dateRange?: DateRange,
  filters?: {
    region?: string
    category?: string
  },
) {
  try {
    // Get top selling products with filters
    const { data: topProducts, error: topProductsError } = await supabase.rpc("get_top_selling_products_with_filters", {
      timeframe_filter: timeframe,
      date_range_start: dateRange?.startDate.toISOString(),
      date_range_end: dateRange?.endDate.toISOString(),
      region_filter: filters?.region || null,
      category_filter: filters?.category || null,
      limit_count: 5,
    })

    if (topProductsError) throw topProductsError

    // Get product categories distribution with filters
    const { data: productCategories, error: productCategoriesError } = await supabase.rpc(
      "get_product_categories_distribution_with_filters",
      {
        region_filter: filters?.region || null,
      },
    )

    if (productCategoriesError) throw productCategoriesError

    // Get product sales trends
    const { data: productSalesTrends, error: productSalesTrendsError } = await supabase.rpc(
      "get_product_sales_trends",
      {
        timeframe_filter: timeframe,
        date_range_start: dateRange?.startDate.toISOString(),
        date_range_end: dateRange?.endDate.toISOString(),
        category_filter: filters?.category || null,
      },
    )

    if (productSalesTrendsError) throw productSalesTrendsError

    // Generate product sales forecast
    const productSalesForecast = generateForecast(
      (productSalesTrends || []).map((item) => ({
        date: item.date,
        value: item.quantity,
      })),
      14, // Forecast for next 14 days
    )

    return {
      topProducts: topProducts || [],
      productCategories: productCategories || [],
      productSalesTrends: productSalesTrends || [],
      productSalesForecast,
    }
  } catch (error) {
    console.error("Error fetching product analytics:", error)
    throw error
  }
}

// Get delivery analytics with advanced filtering
export async function getDeliveryAnalytics(
  timeframe = "week",
  dateRange?: DateRange,
  filters?: {
    region?: string
  },
) {
  try {
    // Get delivery performance with filters
    const { data: deliveryPerformance, error: deliveryPerformanceError } = await supabase.rpc(
      "get_delivery_performance_with_filters",
      {
        timeframe_filter: timeframe,
        date_range_start: dateRange?.startDate.toISOString(),
        date_range_end: dateRange?.endDate.toISOString(),
        region_filter: filters?.region || null,
      },
    )

    if (deliveryPerformanceError) throw deliveryPerformanceError

    // Get average delivery time with filters
    const { data: avgDeliveryTime, error: avgDeliveryTimeError } = await supabase.rpc(
      "get_average_delivery_time_with_filters",
      {
        timeframe_filter: timeframe,
        date_range_start: dateRange?.startDate.toISOString(),
        date_range_end: dateRange?.endDate.toISOString(),
        region_filter: filters?.region || null,
      },
    )

    if (avgDeliveryTimeError) throw avgDeliveryTimeError

    // Get delivery time trends
    const { data: deliveryTimeTrends, error: deliveryTimeTrendsError } = await supabase.rpc(
      "get_delivery_time_trends",
      {
        timeframe_filter: timeframe,
        date_range_start: dateRange?.startDate.toISOString(),
        date_range_end: dateRange?.endDate.toISOString(),
        region_filter: filters?.region || null,
      },
    )

    if (deliveryTimeTrendsError) throw deliveryTimeTrendsError

    return {
      deliveryPerformance: deliveryPerformance || [],
      avgDeliveryTime: avgDeliveryTime?.[0]?.avg_delivery_time || 0,
      deliveryTimeTrends: deliveryTimeTrends || [],
    }
  } catch (error) {
    console.error("Error fetching delivery analytics:", error)
    throw error
  }
}

// Get overall platform analytics with advanced filtering
export async function getPlatformAnalytics(
  dateRange?: DateRange,
  filters?: {
    region?: string
    productCategory?: string
    paymentMethod?: string
  },
) {
  try {
    const orderAnalytics = await getOrderAnalytics("month", dateRange, filters)
    const revenueAnalytics = await getRevenueAnalytics("month", dateRange, filters)
    const userAnalytics = await getUserAnalytics("month", dateRange, { region: filters?.region })
    const productAnalytics = await getProductAnalytics("month", dateRange, {
      region: filters?.region,
      category: filters?.productCategory,
    })
    const deliveryAnalytics = await getDeliveryAnalytics("month", dateRange, { region: filters?.region })

    return {
      orders: orderAnalytics,
      revenue: revenueAnalytics,
      users: userAnalytics,
      products: productAnalytics,
      delivery: deliveryAnalytics,
    }
  } catch (error) {
    console.error("Error fetching platform analytics:", error)
    throw error
  }
}

// Get available regions for filtering
export async function getAvailableRegions() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("region")
      .not("region", "is", null)
      .order("region")
      .distinct()

    if (error) throw error

    return data?.map((item) => item.region) || []
  } catch (error) {
    console.error("Error fetching available regions:", error)
    throw error
  }
}

// Get available product categories for filtering
export async function getAvailableProductCategories() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .order("category")
      .distinct()

    if (error) throw error

    return data?.map((item) => item.category) || []
  } catch (error) {
    console.error("Error fetching available product categories:", error)
    throw error
  }
}

// Get available payment methods for filtering
export async function getAvailablePaymentMethods() {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("payment_method")
      .not("payment_method", "is", null)
      .order("payment_method")
      .distinct()

    if (error) throw error

    return data?.map((item) => item.payment_method) || []
  } catch (error) {
    console.error("Error fetching available payment methods:", error)
    throw error
  }
}
