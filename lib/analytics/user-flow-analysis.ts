import { supabase } from "../supabase-client"

// Interface for flow step
export interface FlowStep {
  step_number: number
  page: string
  event_type: string
  conversion_rate: number
  drop_off_rate: number
  avg_time_spent: number
}

// Interface for user flow
export interface UserFlow {
  flow_name: string
  start_page: string
  end_page: string
  conversion_rate: number
  avg_completion_time: number
  steps: FlowStep[]
}

// Get user flow data for a specific flow
export async function getUserFlowData(flowName: string, startDate: string, endDate: string): Promise<UserFlow | null> {
  try {
    const { data, error } = await supabase.rpc("get_user_flow_analysis", {
      p_flow_name: flowName,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error("Error fetching user flow data:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserFlowData:", error)
    return null
  }
}

// Get all defined user flows
export async function getAllUserFlows(): Promise<{ name: string; description: string }[]> {
  try {
    const { data, error } = await supabase.from("user_flows").select("name, description").order("name")

    if (error) {
      console.error("Error fetching user flows:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllUserFlows:", error)
    return []
  }
}

// Define a new user flow
export async function defineUserFlow(
  name: string,
  description: string,
  startPage: string,
  endPage: string,
  requiredSteps: string[] = [],
): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_flows").insert({
      name,
      description,
      start_page: startPage,
      end_page: endPage,
      required_steps: requiredSteps,
    })

    if (error) {
      console.error("Error defining user flow:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in defineUserFlow:", error)
    return false
  }
}
