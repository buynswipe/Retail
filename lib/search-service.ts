import { supabase } from "./supabase-client"
import type { Product, User, Order } from "./types"

// Search products
export async function searchProducts(
  query: string,
  filters?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    wholesalerId?: string
    sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest"
  },
): Promise<{ data: Product[] | null; error: any }> {
  try {
    let supabaseQuery = supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)

    // Apply filters
    if (filters) {
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq("category", filters.category)
      }
      if (filters.minPrice !== undefined) {
        supabaseQuery = supabaseQuery.gte("price", filters.minPrice)
      }
      if (filters.maxPrice !== undefined) {
        supabaseQuery = supabaseQuery.lte("price", filters.maxPrice)
      }
      if (filters.wholesalerId) {
        supabaseQuery = supabaseQuery.eq("wholesaler_id", filters.wholesalerId)
      }
    }

    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "price-asc":
          supabaseQuery = supabaseQuery.order("price", { ascending: true })
          break
        case "price-desc":
          supabaseQuery = supabaseQuery.order("price", { ascending: false })
          break
        case "name-asc":
          supabaseQuery = supabaseQuery.order("name", { ascending: true })
          break
        case "name-desc":
          supabaseQuery = supabaseQuery.order("name", { ascending: false })
          break
        case "newest":
          supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
          break
        default:
          supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
      }
    } else {
      supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
    }

    const { data, error } = await supabaseQuery

    if (error) {
      console.error("Error searching products:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error searching products:", error)
    return { data: null, error }
  }
}

// Search wholesalers by pin code and optional name
export async function searchWholesalers(pinCode: string, nameQuery = ""): Promise<{ data: User[] | null; error: any }> {
  try {
    let supabaseQuery = supabase
      .from("users")
      .select("*")
      .eq("role", "wholesaler")
      .eq("is_approved", true)
      .eq("pin_code", pinCode)

    // Add name search if provided
    if (nameQuery) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${nameQuery}%,business_name.ilike.%${nameQuery}%`)
    }

    const { data, error } = await supabaseQuery.order("business_name", { ascending: true })

    if (error) {
      console.error("Error searching wholesalers:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error searching wholesalers:", error)
    return { data: null, error }
  }
}

// Search users
export async function searchUsers(
  query: string,
  filters?: {
    role?: "retailer" | "wholesaler" | "delivery" | "admin"
    isApproved?: boolean
    pinCode?: string
  },
): Promise<{ data: User[] | null; error: any }> {
  try {
    let supabaseQuery = supabase
      .from("users")
      .select("*")
      .or(`name.ilike.%${query}%,business_name.ilike.%${query}%,phone_number.ilike.%${query}%,email.ilike.%${query}%`)

    // Apply filters
    if (filters) {
      if (filters.role) {
        supabaseQuery = supabaseQuery.eq("role", filters.role)
      }
      if (filters.isApproved !== undefined) {
        supabaseQuery = supabaseQuery.eq("is_approved", filters.isApproved)
      }
      if (filters.pinCode) {
        supabaseQuery = supabaseQuery.eq("pin_code", filters.pinCode)
      }
    }

    const { data, error } = await supabaseQuery.order("created_at", { ascending: false }).limit(20)

    if (error) {
      console.error("Error searching users:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error searching users:", error)
    return { data: null, error }
  }
}

// Search orders
export async function searchOrders(
  query: string,
  userId: string,
  role: "retailer" | "wholesaler" | "admin",
  filters?: {
    status?: string
    paymentStatus?: string
    startDate?: string
    endDate?: string
  },
): Promise<{ data: Order[] | null; error: any }> {
  try {
    let supabaseQuery = supabase.from("orders").select(`
      *,
      items:order_items(*),
      retailer:retailer_id(*),
      wholesaler:wholesaler_id(*)
    `)

    // Add role-specific filter
    if (role !== "admin") {
      supabaseQuery = supabaseQuery.eq(role === "retailer" ? "retailer_id" : "wholesaler_id", userId)
    }

    // Add search query
    if (query) {
      supabaseQuery = supabaseQuery.or(`order_number.ilike.%${query}%,id.eq.${query}`)
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        supabaseQuery = supabaseQuery.eq("status", filters.status)
      }
      if (filters.paymentStatus) {
        supabaseQuery = supabaseQuery.eq("payment_status", filters.paymentStatus)
      }
      if (filters.startDate) {
        supabaseQuery = supabaseQuery.gte("created_at", filters.startDate)
      }
      if (filters.endDate) {
        supabaseQuery = supabaseQuery.lte("created_at", filters.endDate)
      }
    }

    const { data, error } = await supabaseQuery.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching orders:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error searching orders:", error)
    return { data: null, error }
  }
}

// Get product categories
export async function getProductCategories(): Promise<{ data: string[] | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc("get_product_categories")

    if (error) {
      console.error("Error fetching product categories:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching product categories:", error)
    return { data: null, error }
  }
}

// Get product price range
export async function getProductPriceRange(): Promise<{ min: number; max: number; error: any }> {
  try {
    const { data: minData, error: minError } = await supabase
      .from("products")
      .select("price")
      .order("price", { ascending: true })
      .limit(1)
      .single()

    if (minError) {
      console.error("Error fetching min price:", minError)
      return { min: 0, max: 5000, error: minError }
    }

    const { data: maxData, error: maxError } = await supabase
      .from("products")
      .select("price")
      .order("price", { ascending: false })
      .limit(1)
      .single()

    if (maxError) {
      console.error("Error fetching max price:", maxError)
      return { min: 0, max: 5000, error: maxError }
    }

    return { min: minData.price, max: maxData.price, error: null }
  } catch (error) {
    console.error("Error fetching product price range:", error)
    return { min: 0, max: 5000, error }
  }
}
