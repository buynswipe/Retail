import { createClient } from "@/lib/supabase-client"

// Get all products
export async function getAllProducts(filters = {}) {
  const supabase = createClient()

  let query = supabase.from("products").select("*, categories(name), wholesaler:wholesaler_id(id, name, business_name)")

  // Apply filters if provided
  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id)
  }

  if (filters.wholesaler_id) {
    query = query.eq("wholesaler_id", filters.wholesaler_id)
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`)
  }

  return await query.order("created_at", { ascending: false })
}

// Add the missing function
export const getProducts = getAllProducts

// Get product by ID
export async function getProductById(id) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name), wholesaler:wholesaler_id(id, name, business_name)")
    .eq("id", id)
    .single()

  return { data, error }
}

// Create a new product
export async function createProduct(productData) {
  const supabase = createClient()

  return await supabase.from("products").insert(productData).select()
}

// Update a product
export async function updateProduct(id, productData) {
  const supabase = createClient()

  return await supabase.from("products").update(productData).eq("id", id).select()
}

// Delete a product
export async function deleteProduct(id) {
  const supabase = createClient()

  return await supabase.from("products").delete().eq("id", id)
}

// Get products by category
export async function getProductsByCategory(categoryId) {
  const supabase = createClient()

  return await supabase
    .from("products")
    .select("*, categories(name), wholesaler:wholesaler_id(id, name, business_name)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
}

// Get products by wholesaler
export async function getProductsByWholesaler(wholesalerId) {
  const supabase = createClient()

  return await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("wholesaler_id", wholesalerId)
    .order("created_at", { ascending: false })
}

// Search products
export async function searchProducts(query) {
  const supabase = createClient()

  return await supabase
    .from("products")
    .select("*, categories(name), wholesaler:wholesaler_id(id, name, business_name)")
    .ilike("name", `%${query}%`)
    .order("created_at", { ascending: false })
}

// Get featured products
export async function getFeaturedProducts(limit = 6) {
  const supabase = createClient()

  return await supabase
    .from("products")
    .select("*, categories(name), wholesaler:wholesaler_id(id, name, business_name)")
    .eq("is_featured", true)
    .limit(limit)
    .order("created_at", { ascending: false })
}

// Get product reviews
export async function getProductReviews(productId) {
  const supabase = createClient()

  return await supabase
    .from("product_reviews")
    .select("*, retailer:retailer_id(id, name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
}

// Add product review
export async function addProductReview(reviewData) {
  const supabase = createClient()

  return await supabase.from("product_reviews").insert(reviewData).select()
}
