import { supabase } from "./supabase-client"
import type { Product, ProductBatch, InventoryTransaction } from "./types"

// Get product inventory
export async function getProductInventory(productId: string): Promise<{
  data: { product: Product; batches: ProductBatch[]; transactions: InventoryTransaction[] } | null
  error: any
}> {
  try {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) {
      throw productError
    }

    // Get product batches
    const { data: batches, error: batchesError } = await supabase
      .from("product_batches")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (batchesError) {
      throw batchesError
    }

    // Get inventory transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("inventory_transactions")
      .select("*, user:users(name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (transactionsError) {
      throw transactionsError
    }

    // Format transactions
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      reason: transaction.reason,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      userName: transaction.user?.name || "Unknown",
    }))

    return {
      data: {
        product,
        batches,
        transactions: formattedTransactions,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting product inventory:", error)
    return { data: null, error }
  }
}

// Get inventory for a product
export async function getInventoryForProduct(productId: string): Promise<{ data: any | null; error: any }> {
  try {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) {
      throw productError
    }

    // Get total quantity from batches
    const { data: batches, error: batchesError } = await supabase
      .from("product_batches")
      .select("quantity")
      .eq("product_id", productId)

    if (batchesError) {
      throw batchesError
    }

    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0)

    // Get low stock threshold
    const { data: settings, error: settingsError } = await supabase
      .from("product_settings")
      .select("low_stock_threshold")
      .eq("product_id", productId)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error, which is fine
      throw settingsError
    }

    const lowStockThreshold = settings?.low_stock_threshold || 10

    // Get latest transaction
    const { data: latestTransaction, error: transactionError } = await supabase
      .from("inventory_transactions")
      .select("created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transactionError && transactionError.code !== "PGRST116") {
      throw transactionError
    }

    return {
      data: {
        product,
        total_quantity: totalQuantity,
        low_stock_threshold: lowStockThreshold,
        is_low_stock: totalQuantity <= lowStockThreshold,
        batch_count: batches.length,
        last_updated: latestTransaction?.created_at || product.updated_at,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error getting inventory for product:", error)
    return { data: null, error }
  }
}

// Update product stock
export async function updateProductStock(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string,
  userId?: string,
  batchId?: string,
): Promise<{ success: boolean; error: any }> {
  try {
    // Get current user if not provided
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id
    }

    if (!userId) {
      throw new Error("User ID is required")
    }

    // Create inventory transaction
    const { error: transactionError } = await supabase.from("inventory_transactions").insert({
      product_id: productId,
      user_id: userId,
      quantity,
      type: quantity > 0 ? "increase" : "decrease",
      reason,
      notes,
      batch_id: batchId,
    })

    if (transactionError) {
      throw transactionError
    }

    // Update product stock
    if (batchId) {
      // Update specific batch
      const { data: batch, error: batchError } = await supabase
        .from("product_batches")
        .select("quantity")
        .eq("id", batchId)
        .single()

      if (batchError) {
        throw batchError
      }

      const newQuantity = batch.quantity + quantity
      if (newQuantity < 0) {
        throw new Error("Insufficient stock in batch")
      }

      const { error: updateError } = await supabase
        .from("product_batches")
        .update({ quantity: newQuantity })
        .eq("id", batchId)

      if (updateError) {
        throw updateError
      }
    } else {
      // Update product stock_quantity
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single()

      if (productError) {
        throw productError
      }

      const newQuantity = product.stock_quantity + quantity
      if (newQuantity < 0) {
        throw new Error("Insufficient stock")
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", productId)

      if (updateError) {
        throw updateError
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating product stock:", error)
    return { success: false, error }
  }
}

// Add product batch
export async function addProductBatch(
  productId: string,
  batchData: {
    batch_number: string
    quantity: number
    manufacturing_date?: string
    expiry_date?: string
    cost_price?: number
    notes?: string
  },
): Promise<{ data: ProductBatch | null; error: any }> {
  try {
    // Add batch
    const { data: batch, error: batchError } = await supabase
      .from("product_batches")
      .insert({
        product_id: productId,
        batch_number: batchData.batch_number,
        quantity: batchData.quantity,
        manufacturing_date: batchData.manufacturing_date,
        expiry_date: batchData.expiry_date,
        cost_price: batchData.cost_price,
        notes: batchData.notes,
      })
      .select()
      .single()

    if (batchError) {
      throw batchError
    }

    // Update product stock_quantity
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (productError) {
      throw productError
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: product.stock_quantity + batchData.quantity })
      .eq("id", productId)

    if (updateError) {
      throw updateError
    }

    // Create inventory transaction
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await updateProductStock(
        productId,
        batchData.quantity,
        "batch_added",
        `Added batch ${batchData.batch_number}`,
        user.id,
        batch.id,
      )
    }

    return { data: batch, error: null }
  } catch (error) {
    console.error("Error adding product batch:", error)
    return { data: null, error }
  }
}

// Get low stock products
export async function getLowStockProducts(wholesalerId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    // Get all products for the wholesaler
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("wholesaler_id", wholesalerId)

    if (productsError) {
      throw productsError
    }

    // Get product settings for low stock thresholds
    const { data: settings, error: settingsError } = await supabase
      .from("product_settings")
      .select("*")
      .in(
        "product_id",
        products.map((p) => p.id),
      )

    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError
    }

    // Create a map of product_id to low_stock_threshold
    const thresholdMap = (settings || []).reduce(
      (map, setting) => {
        map[setting.product_id] = setting.low_stock_threshold
        return map
      },
      {} as Record<string, number>,
    )

    // Filter low stock products
    const lowStockProducts = products.filter((product) => {
      const threshold = thresholdMap[product.id] || 10 // Default threshold
      return product.stock_quantity <= threshold
    })

    // Sort by stock level (lowest first)
    lowStockProducts.sort((a, b) => a.stock_quantity - b.stock_quantity)

    return { data: lowStockProducts, error: null }
  } catch (error) {
    console.error("Error getting low stock products:", error)
    return { data: null, error }
  }
}

// Get expiring batches
export async function getExpiringBatches(
  wholesalerId: string,
  daysThreshold = 30,
): Promise<{ data: any[] | null; error: any }> {
  try {
    // Calculate the threshold date
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    // Get all products for the wholesaler
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("wholesaler_id", wholesalerId)

    if (productsError) {
      throw productsError
    }

    if (!products.length) {
      return { data: [], error: null }
    }

    // Get batches that are expiring soon
    const { data: batches, error: batchesError } = await supabase
      .from("product_batches")
      .select("*, product:products(*)")
      .in(
        "product_id",
        products.map((p) => p.id),
      )
      .lt("expiry_date", thresholdDate.toISOString())
      .gt("expiry_date", new Date().toISOString()) // Not already expired
      .gt("quantity", 0) // Only batches with stock
      .order("expiry_date", { ascending: true })

    if (batchesError) {
      throw batchesError
    }

    return { data: batches, error: null }
  } catch (error) {
    console.error("Error getting expiring batches:", error)
    return { data: null, error }
  }
}

// Add the missing functions
export async function getInventoryByWholesaler(wholesalerId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    // Get all products for the wholesaler
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("wholesaler_id", wholesalerId)

    if (productsError) {
      throw productsError
    }

    if (!products.length) {
      return { data: [], error: null }
    }

    // Get inventory data for each product
    const inventoryData = await Promise.all(
      products.map(async (product) => {
        const { data } = await getInventoryForProduct(product.id)
        return data
      }),
    )

    return { data: inventoryData.filter(Boolean), error: null }
  } catch (error) {
    console.error("Error getting inventory by wholesaler:", error)
    return { data: null, error }
  }
}

export async function updateLowStockThreshold(
  productId: string,
  threshold: number,
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if settings exist
    const { data: settings, error: checkError } = await supabase
      .from("product_settings")
      .select("id")
      .eq("product_id", productId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (settings) {
      // Update existing settings
      const { error } = await supabase
        .from("product_settings")
        .update({ low_stock_threshold: threshold })
        .eq("product_id", productId)

      if (error) {
        throw error
      }
    } else {
      // Create new settings
      const { error } = await supabase.from("product_settings").insert({
        product_id: productId,
        low_stock_threshold: threshold,
      })

      if (error) {
        throw error
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating low stock threshold:", error)
    return { success: false, error }
  }
}

export const createInventoryBatch = addProductBatch

export async function createInventoryAdjustment(
  productId: string,
  quantity: number,
  reason: string,
  notes?: string,
): Promise<{ success: boolean; error: any }> {
  return updateProductStock(productId, quantity, reason, notes)
}

export const getInventoryByProduct = getInventoryForProduct

export async function getInventoryBatches(productId: string): Promise<{ data: ProductBatch[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("product_batches")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting inventory batches:", error)
    return { data: null, error }
  }
}

export async function getInventoryTransactions(
  productId: string,
): Promise<{ data: InventoryTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("*, user:users(name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Error getting inventory transactions:", error)
    return { data: null, error }
  }
}
