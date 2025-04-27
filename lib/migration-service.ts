import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface Migration {
  id: string
  name: string
  description: string
  sql: string
  status: "pending" | "applied" | "failed"
  created_at: string
  applied_at: string | null
  error: string | null
}

export async function getMigrations() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("migrations").select("*").order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching migrations", error)
      throw error
    }

    return data as Migration[]
  } catch (error) {
    logger.error("Error getting migrations", error)
    return []
  }
}

export async function createMigration(name: string, description: string, sql: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("migrations")
      .insert([
        {
          name,
          description,
          sql,
          status: "pending",
        },
      ])
      .select()

    if (error) {
      logger.error("Error creating migration", error)
      throw error
    }

    return { success: true, migration: data[0] }
  } catch (error) {
    logger.error("Error creating migration", error)
    return { success: false, error }
  }
}

export async function applyMigration(id: string) {
  try {
    const supabase = createClient()

    // Get the migration
    const { data: migration, error: fetchError } = await supabase.from("migrations").select("*").eq("id", id).single()

    if (fetchError) {
      logger.error("Error fetching migration", fetchError)
      throw fetchError
    }

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc("execute_sql", {
      sql_query: migration.sql,
    })

    if (sqlError) {
      // Update migration status to failed
      await supabase
        .from("migrations")
        .update({
          status: "failed",
          error: sqlError.message,
          applied_at: new Date().toISOString(),
        })
        .eq("id", id)

      logger.error("Error executing migration SQL", sqlError)
      throw sqlError
    }

    // Update migration status to applied
    const { error: updateError } = await supabase
      .from("migrations")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", id)

    if (updateError) {
      logger.error("Error updating migration status", updateError)
      throw updateError
    }

    return { success: true }
  } catch (error) {
    logger.error("Error applying migration", error)
    return { success: false, error }
  }
}

export async function getMigrationStats() {
  try {
    const migrations = await getMigrations()

    return {
      total: migrations.length,
      applied: migrations.filter((m) => m.status === "applied").length,
      pending: migrations.filter((m) => m.status === "pending").length,
      failed: migrations.filter((m) => m.status === "failed").length,
    }
  } catch (error) {
    logger.error("Error getting migration stats", error)
    return {
      total: 0,
      applied: 0,
      pending: 0,
      failed: 0,
    }
  }
}
