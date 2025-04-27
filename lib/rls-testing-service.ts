import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface RlsTestResult {
  id: string
  table_name: string
  operation: "select" | "insert" | "update" | "delete"
  role: string
  expected_result: boolean
  actual_result: boolean
  passed: boolean
  created_at: string
}

export interface RlsTestSummary {
  total: number
  passed: number
  failed: number
  passRate: number
}

export async function runRlsTests() {
  try {
    const supabase = createClient()

    // Run the RLS tests stored procedure
    const { data, error } = await supabase.rpc("run_rls_tests")

    if (error) {
      logger.error("Error running RLS tests", error)
      throw error
    }

    return { success: true, results: data }
  } catch (error) {
    logger.error("Error running RLS tests", error)
    return { success: false, error }
  }
}

export async function getRlsTestResults() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("rls_test_results")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching RLS test results", error)
      throw error
    }

    return data as RlsTestResult[]
  } catch (error) {
    logger.error("Error getting RLS test results", error)
    return []
  }
}

export async function getRlsTestSummary(): Promise<RlsTestSummary> {
  try {
    const results = await getRlsTestResults()

    const total = results.length
    const passed = results.filter((r) => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? (passed / total) * 100 : 0

    return {
      total,
      passed,
      failed,
      passRate,
    }
  } catch (error) {
    logger.error("Error getting RLS test summary", error)
    return {
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
    }
  }
}

export async function createRlsTest(
  tableName: string,
  operation: "select" | "insert" | "update" | "delete",
  role: string,
  expectedResult: boolean,
) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("rls_tests")
      .insert([
        {
          table_name: tableName,
          operation,
          role,
          expected_result: expectedResult,
        },
      ])
      .select()

    if (error) {
      logger.error("Error creating RLS test", error)
      throw error
    }

    return { success: true, test: data[0] }
  } catch (error) {
    logger.error("Error creating RLS test", error)
    return { success: false, error }
  }
}
