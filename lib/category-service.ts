import { createClient } from "@/lib/supabase-client"

// Get all categories
export async function getCategories() {
  const supabase = createClient()

  return await supabase.from("categories").select("*").order("name", { ascending: true })
}

// Get category by ID
export async function getCategoryById(id: string) {
  const supabase = createClient()

  return await supabase.from("categories").select("*").eq("id", id).single()
}

// Create a new category
export async function createCategory(categoryData: { name: string; description?: string; parent_id?: string }) {
  const supabase = createClient()

  return await supabase.from("categories").insert(categoryData).select()
}

// Update a category
export async function updateCategory(
  id: string,
  categoryData: { name?: string; description?: string; parent_id?: string },
) {
  const supabase = createClient()

  return await supabase.from("categories").update(categoryData).eq("id", id).select()
}

// Delete a category
export async function deleteCategory(id: string) {
  const supabase = createClient()

  return await supabase.from("categories").delete().eq("id", id)
}

// Get subcategories
export async function getSubcategories(parentId: string) {
  const supabase = createClient()

  return await supabase.from("categories").select("*").eq("parent_id", parentId).order("name", { ascending: true })
}

// Get root categories (categories without a parent)
export async function getRootCategories() {
  const supabase = createClient()

  return await supabase.from("categories").select("*").is("parent_id", null).order("name", { ascending: true })
}

// Get category tree
export async function getCategoryTree() {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

  if (error) {
    return { data: null, error }
  }

  // Build tree structure
  const categoryMap = {}
  const rootCategories = []

  // First pass: create map of id -> category
  data.forEach((category) => {
    categoryMap[category.id] = {
      ...category,
      children: [],
    }
  })

  // Second pass: build tree structure
  data.forEach((category) => {
    if (category.parent_id) {
      // This is a child category
      if (categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(categoryMap[category.id])
      }
    } else {
      // This is a root category
      rootCategories.push(categoryMap[category.id])
    }
  })

  return { data: rootCategories, error: null }
}
