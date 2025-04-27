import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Verify admin permissions
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (adminError || adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get the new role from the request body
    const { role } = await request.json()

    if (!role || !["admin", "retailer", "wholesaler", "delivery"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Update the user's role
    const { error: updateError } = await supabaseAdmin.from("users").update({ role }).eq("id", params.userId)

    if (updateError) {
      console.error("Error updating user role:", updateError)
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in role update API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
