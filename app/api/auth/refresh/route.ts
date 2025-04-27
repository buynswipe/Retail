import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Refresh the session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  if (!session) {
    return NextResponse.json({ error: "No session found" }, { status: 401 })
  }

  // Get the user's profile data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    user: {
      id: userData.id,
      phone: userData.phone_number,
      role: userData.role,
      name: userData.name,
      businessName: userData.business_name,
      pinCode: userData.pin_code,
      isApproved: userData.is_approved,
    },
  })
}
