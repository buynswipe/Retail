import { supabase } from "./supabase-client"

export type InvoiceTemplateType = "standard" | "detailed"

export interface TemplatePreference {
  user_id: string
  default_invoice_template: InvoiceTemplateType
}

export async function getUserTemplatePreference(userId: string): Promise<InvoiceTemplateType> {
  try {
    // For demo users, return a default
    if (userId.startsWith("user-")) {
      return "standard"
    }

    // Check if the table exists
    try {
      const { error: tableCheckError } = await supabase.from("template_preferences").select("user_id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("template_preferences table does not exist, returning default")
        return "standard"
      }
    } catch (error) {
      console.error("Error checking template_preferences table:", error)
      return "standard"
    }

    // Get user preference
    const { data, error } = await supabase
      .from("template_preferences")
      .select("default_invoice_template")
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No preference found, create default
        await setUserTemplatePreference(userId, "standard")
        return "standard"
      }
      console.error("Error fetching template preference:", error)
      return "standard"
    }

    return data.default_invoice_template
  } catch (error) {
    console.error("Error in getUserTemplatePreference:", error)
    return "standard"
  }
}

export async function setUserTemplatePreference(
  userId: string,
  template: InvoiceTemplateType,
): Promise<{ success: boolean; error: any }> {
  try {
    // For demo users, just return success
    if (userId.startsWith("user-")) {
      return { success: true, error: null }
    }

    // Check if the table exists
    try {
      const { error: tableCheckError } = await supabase.from("template_preferences").select("user_id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("template_preferences table does not exist, simulating update")
        return { success: true, error: null }
      }
    } catch (error) {
      console.error("Error checking template_preferences table:", error)
      return { success: true, error: null }
    }

    // Upsert preference
    const { error } = await supabase.from("template_preferences").upsert(
      {
        user_id: userId,
        default_invoice_template: template,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (error) {
      console.error("Error setting template preference:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in setUserTemplatePreference:", error)
    return { success: false, error }
  }
}
