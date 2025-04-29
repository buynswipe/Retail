import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase.from("products").select("*", { count: "exact" })

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    // Return with cache headers
    return NextResponse.json(
      {
        products: data,
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
