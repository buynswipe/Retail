import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface SecurityAuditResult {
  id: string
  category: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved" | "ignored"
  created_at: string
  updated_at: string
}

export interface SecurityAuditSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  resolved: number
  open: number
}

export async function runSecurityAudit() {
  try {
    const supabase = createClient()

    // Check for public tables without RLS
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables_without_rls")

    if (tablesError) {
      logger.error("Error fetching tables without RLS", tablesError)
      throw tablesError
    }

    // Check for weak policies
    const { data: weakPolicies, error: policiesError } = await supabase.rpc("get_weak_policies")

    if (policiesError) {
      logger.error("Error fetching weak policies", policiesError)
      throw policiesError
    }

    // Insert audit results
    const { error: insertError } = await supabase.from("security_audits").insert([
      ...tables.map((table: string) => ({
        category: "RLS",
        description: `Table ${table} does not have RLS enabled`,
        severity: "critical",
        status: "open",
      })),
      ...weakPolicies.map((policy: any) => ({
        category: "Policy",
        description: `Weak policy on table ${policy.table_name}: ${policy.policy_name}`,
        severity: "high",
        status: "open",
      })),
    ])

    if (insertError) {
      logger.error("Error inserting audit results", insertError)
      throw insertError
    }

    return { success: true }
  } catch (error) {
    logger.error("Error running security audit", error)
    return { success: false, error }
  }
}

export async function getSecurityAuditResults() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("security_audits").select("*").order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching security audit results", error)
      throw error
    }

    return data as SecurityAuditResult[]
  } catch (error) {
    logger.error("Error getting security audit results", error)
    return []
  }
}

export async function getSecurityAuditSummary(): Promise<SecurityAuditSummary> {
  try {
    const results = await getSecurityAuditResults()

    return {
      total: results.length,
      critical: results.filter((r) => r.severity === "critical").length,
      high: results.filter((r) => r.severity === "high").length,
      medium: results.filter((r) => r.severity === "medium").length,
      low: results.filter((r) => r.severity === "low").length,
      resolved: results.filter((r) => r.status === "resolved").length,
      open: results.filter((r) => r.status === "open" || r.status === "in_progress").length,
    }
  } catch (error) {
    logger.error("Error getting security audit summary", error)
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
      open: 0,
    }
  }
}

export async function updateSecurityAuditStatus(id: string, status: "open" | "in_progress" | "resolved" | "ignored") {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("security_audits")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      logger.error("Error updating security audit status", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    logger.error("Error updating security audit status", error)
    return { success: false, error }
  }
}
