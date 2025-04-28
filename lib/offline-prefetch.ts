import indexedDBService from "./indexed-db"
import { supabase } from "./supabase-client"

// Tables to prefetch for offline use
const TABLES_TO_PREFETCH = ["products", "categories", "orders", "cart_items", "notifications"]

// Prefetch data for offline use
export async function prefetchDataForOffline(userId: string) {
  try {
    // Prefetch products
    const { data: products } = await supabase.from("products").select("*").order("name")

    if (products) {
      await indexedDBService.storeOfflineData("products:all", products)
    }

    // Prefetch user's orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        *,
        order_items:order_items(
          *,
          product:product_id(*)
        )
      `)
      .eq("retailer_id", userId)
      .order("created_at", { ascending: false })

    if (orders) {
      await indexedDBService.storeOfflineData(`orders:${userId}`, orders)
    }

    // Prefetch user's cart
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("*, product:product_id(*)")
      .eq("user_id", userId)

    if (cartItems) {
      await indexedDBService.storeOfflineData(`cart:${userId}`, cartItems)
    }

    // Prefetch user's notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (notifications) {
      await indexedDBService.storeOfflineData(`notifications:${userId}`, notifications)
    }

    return { success: true }
  } catch (error) {
    console.error("Error prefetching data for offline use:", error)
    return { success: false, error }
  }
}

// Clear offline data
export async function clearOfflineData() {
  return indexedDBService.clearOfflineData()
}

// Prefetch specific entity by ID
export async function prefetchEntityById(table: string, id: string) {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

    if (error) throw error

    if (data) {
      await indexedDBService.storeOfflineData(`${table}:${id}`, data)
    }

    return { success: true }
  } catch (error) {
    console.error(`Error prefetching ${table} with ID ${id}:`, error)
    return { success: false, error }
  }
}
