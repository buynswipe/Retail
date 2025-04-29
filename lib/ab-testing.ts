import { supabase } from "./supabase-client"

// Define test types
export type ABTest = {
  id: string
  name: string
  variants: string[]
  weights?: number[]
  isActive: boolean
  startDate: string
  endDate?: string
}

// Define user assignment
export type ABTestAssignment = {
  testId: string
  variant: string
  userId?: string
  sessionId: string
  timestamp: string
}

// Define conversion event
export type ABTestConversion = {
  testId: string
  variant: string
  userId?: string
  sessionId: string
  conversionType: string
  timestamp: string
  metadata?: Record<string, any>
}

// Get active tests
export async function getActiveTests(): Promise<ABTest[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("ab_tests")
    .select("*")
    .eq("isActive", true)
    .lte("startDate", now)
    .or(`endDate.gt.${now},endDate.is.null`)

  if (error) {
    console.error("Error fetching active tests:", error)
    return []
  }

  return data || []
}

// Assign user to test variant
export async function assignUserToVariant(testId: string, userId?: string, sessionId?: string): Promise<string> {
  // Get test details
  const { data: test, error } = await supabase.from("ab_tests").select("*").eq("id", testId).single()

  if (error || !test) {
    console.error("Error fetching test:", error)
    return "control" // Default to control variant
  }

  // If user already has an assignment, return it
  if (userId) {
    const { data: existingAssignment } = await supabase
      .from("ab_test_assignments")
      .select("variant")
      .eq("testId", testId)
      .eq("userId", userId)
      .single()

    if (existingAssignment) {
      return existingAssignment.variant
    }
  }

  // If session already has an assignment, return it
  if (sessionId) {
    const { data: existingAssignment } = await supabase
      .from("ab_test_assignments")
      .select("variant")
      .eq("testId", testId)
      .eq("sessionId", sessionId)
      .single()

    if (existingAssignment) {
      return existingAssignment.variant
    }
  }

  // Assign to variant based on weights or randomly
  const { variants, weights = [] } = test
  let variant: string

  if (weights.length === variants.length) {
    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const random = Math.random() * totalWeight
    let cumulativeWeight = 0

    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += weights[i]
      if (random <= cumulativeWeight) {
        variant = variants[i]
        break
      }
    }

    // Fallback to first variant if something went wrong
    if (!variant) {
      variant = variants[0]
    }
  } else {
    // Equal probability
    const randomIndex = Math.floor(Math.random() * variants.length)
    variant = variants[randomIndex]
  }

  // Store assignment
  await supabase.from("ab_test_assignments").insert({
    testId,
    variant,
    userId,
    sessionId: sessionId || `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
  })

  return variant
}

// Track conversion
export async function trackConversion(
  testId: string,
  conversionType: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  // Get user's variant
  let variant: string | null = null

  if (userId) {
    const { data: assignment } = await supabase
      .from("ab_test_assignments")
      .select("variant")
      .eq("testId", testId)
      .eq("userId", userId)
      .single()

    if (assignment) {
      variant = assignment.variant
    }
  }

  if (!variant && sessionId) {
    const { data: assignment } = await supabase
      .from("ab_test_assignments")
      .select("variant")
      .eq("testId", testId)
      .eq("sessionId", sessionId)
      .single()

    if (assignment) {
      variant = assignment.variant
    }
  }

  if (!variant) {
    console.error("No variant assignment found for conversion tracking")
    return
  }

  // Store conversion
  await supabase.from("ab_test_conversions").insert({
    testId,
    variant,
    userId,
    sessionId: sessionId || `session-${Date.now()}`,
    conversionType,
    timestamp: new Date().toISOString(),
    metadata,
  })
}

// Get test results
export async function getTestResults(testId: string): Promise<{
  testId: string
  variants: Record<
    string,
    {
      assignments: number
      conversions: Record<string, number>
      conversionRate: Record<string, number>
    }
  >
}> {
  // Get test details
  const { data: test, error } = await supabase.from("ab_tests").select("*").eq("id", testId).single()

  if (error || !test) {
    console.error("Error fetching test:", error)
    throw new Error("Test not found")
  }

  // Get assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from("ab_test_assignments")
    .select("variant")
    .eq("testId", testId)

  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError)
    throw new Error("Failed to fetch assignments")
  }

  // Get conversions
  const { data: conversions, error: conversionsError } = await supabase
    .from("ab_test_conversions")
    .select("variant, conversionType")
    .eq("testId", testId)

  if (conversionsError) {
    console.error("Error fetching conversions:", conversionsError)
    throw new Error("Failed to fetch conversions")
  }

  // Calculate results
  const results: Record<
    string,
    {
      assignments: number
      conversions: Record<string, number>
      conversionRate: Record<string, number>
    }
  > = {}

  // Initialize results for each variant
  test.variants.forEach((variant) => {
    results[variant] = {
      assignments: 0,
      conversions: {},
      conversionRate: {},
    }
  })

  // Count assignments
  assignments.forEach((assignment) => {
    if (results[assignment.variant]) {
      results[assignment.variant].assignments++
    }
  })

  // Count conversions by type
  conversions.forEach((conversion) => {
    if (results[conversion.variant]) {
      if (!results[conversion.variant].conversions[conversion.conversionType]) {
        results[conversion.variant].conversions[conversion.conversionType] = 0
      }
      results[conversion.variant].conversions[conversion.conversionType]++
    }
  })

  // Calculate conversion rates
  Object.keys(results).forEach((variant) => {
    Object.keys(results[variant].conversions).forEach((conversionType) => {
      results[variant].conversionRate[conversionType] =
        results[variant].assignments > 0
          ? results[variant].conversions[conversionType] / results[variant].assignments
          : 0
    })
  })

  return {
    testId,
    variants: results,
  }
}
