import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"

export interface TestCase {
  id: string
  name: string
  description: string
  category: "unit" | "integration" | "e2e"
  status: "pending" | "passed" | "failed"
  created_at: string
  last_run: string | null
  error: string | null
}

export interface TestSummary {
  total: number
  passed: number
  failed: number
  pending: number
  passRate: number
}

export async function getTestCases() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("test_cases").select("*").order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching test cases", error)
      throw error
    }

    return data as TestCase[]
  } catch (error) {
    logger.error("Error getting test cases", error)
    return []
  }
}

export async function createTestCase(name: string, description: string, category: "unit" | "integration" | "e2e") {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("test_cases")
      .insert([
        {
          name,
          description,
          category,
          status: "pending",
        },
      ])
      .select()

    if (error) {
      logger.error("Error creating test case", error)
      throw error
    }

    return { success: true, testCase: data[0] }
  } catch (error) {
    logger.error("Error creating test case", error)
    return { success: false, error }
  }
}

export async function runTest(id: string) {
  try {
    const supabase = createClient()

    // In a real application, this would execute the actual test
    // For now, we'll simulate a test run with a random result
    const passed = Math.random() > 0.3 // 70% chance of passing

    const { error } = await supabase
      .from("test_cases")
      .update({
        status: passed ? "passed" : "failed",
        last_run: new Date().toISOString(),
        error: passed ? null : "Simulated test failure",
      })
      .eq("id", id)

    if (error) {
      logger.error("Error updating test case", error)
      throw error
    }

    return { success: true, passed }
  } catch (error) {
    logger.error("Error running test", error)
    return { success: false, error }
  }
}

export async function runAllTests() {
  try {
    const testCases = await getTestCases()
    const results = await Promise.all(testCases.map((test) => runTest(test.id)))

    return {
      success: true,
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
    }
  } catch (error) {
    logger.error("Error running all tests", error)
    return { success: false, error }
  }
}

export async function getTestSummary(): Promise<TestSummary> {
  try {
    const testCases = await getTestCases()

    const total = testCases.length
    const passed = testCases.filter((t) => t.status === "passed").length
    const failed = testCases.filter((t) => t.status === "failed").length
    const pending = testCases.filter((t) => t.status === "pending").length
    const passRate = total > 0 ? (passed / (passed + failed)) * 100 : 0

    return {
      total,
      passed,
      failed,
      pending,
      passRate,
    }
  } catch (error) {
    logger.error("Error getting test summary", error)
    return {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      passRate: 0,
    }
  }
}
