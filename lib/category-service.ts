import { supabase } from "./supabase-client"

// Get all categories
export async function getCategories() {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch categories",
    }
  }
}

// Get category by ID
export async function getCategoryById(id: string) {
  try {
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching category:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch category",
    }
  }
}

// Create a new category
export async function createCategory(name: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error creating category:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create category",
    }
  }
}

// Update a category
export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  try {
    const { data: updatedData, error } = await supabase
      .from("categories")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { data: updatedData, error: null }
  } catch (error) {
    console.error("Error updating category:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update category",
    }
  }
}

// Delete a category
export async function deleteCategory(id: string) {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    }
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string) {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("category_id", categoryId)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error fetching products by category:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch products by category",
    }
  }
}
