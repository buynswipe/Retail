import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get the pathname from the URL
    const path = req.nextUrl.pathname

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup", "/about", "/contact", "/privacy", "/terms"]

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(
      (route) =>
        path === route || path.startsWith("/api/") || path.includes("/_next/") || path.includes("/favicon.ico"),
    )

    // If not authenticated and not a public route, redirect to login
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirectTo", path)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated, check role-based access
    if (session) {
      try {
        // Get user role from custom claims
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (error) {
          console.error("Error fetching user role:", error.message)
          return res
        }

        const role = userData?.role

        // Role-based route protection
        if (path.startsWith("/admin") && role !== "admin") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        if (path.startsWith("/retailer") && role !== "retailer") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        if (path.startsWith("/wholesaler") && role !== "wholesaler") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        if (path.startsWith("/delivery") && role !== "delivery") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      } catch (error) {
        console.error("Error in role verification:", error)
        // Continue with the request even if role verification fails
        return res
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error in the middleware, continue with the request
    return res
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}
