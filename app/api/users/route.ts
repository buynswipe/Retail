import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role")
    const approval = searchParams.get("approval")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Build the query
    let query = supabaseAdmin.from("users").select("*", { count: "exact" })

    // Apply filters
    if (role) {
      query = query.eq("role", role)
    }

    if (approval === "approved") {
      query = query.eq("is_approved", true)
    } else if (approval === "pending") {
      query = query.eq("is_approved", false)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Execute the query
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to)

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Format the response
    const users = data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone_number,
      role: user.role,
      isApproved: user.is_approved,
      businessName: user.business_name,
      pinCode: user.pin_code,
      createdAt: user.created_at,
    }))

    return NextResponse.json({
      users,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
