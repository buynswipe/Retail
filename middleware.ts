import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define cacheable paths
const CACHEABLE_PATHS = ["/", "/login", "/signup", "/about", "/faq", "/help", "/contact"]

// Define static asset patterns
const STATIC_ASSET_PATTERNS = [/\.(jpg|jpeg|png|gif|svg|webp|avif)$/, /\.(css|js)$/, /^\/fonts\//, /^\/icons\//]

// Define role-specific path patterns
const ROLE_PATH_PATTERNS = {
  retailer: /^\/retailer\//,
  wholesaler: /^\/wholesaler\//,
  delivery: /^\/delivery\//,
  admin: /^\/admin\//,
}

// Define common paths that are accessible to all authenticated users
const COMMON_AUTH_PATHS = ["/profile", "/notifications", "/notification-preferences", "/chat"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip static assets and public files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next()
  }

  // Get user info from cookies (in a real app, this would be a JWT token)
  const userRole = request.cookies.get("userRole")?.value

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/signup", "/about", "/faq", "/help", "/contact", "/privacy", "/terms"]
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Handle role-specific paths
  for (const [role, pattern] of Object.entries(ROLE_PATH_PATTERNS)) {
    if (pattern.test(pathname)) {
      // If trying to access a role-specific path without being logged in
      if (!userRole) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(url)
      }

      // If trying to access a role-specific path with the wrong role
      if (userRole !== role) {
        const url = request.nextUrl.clone()

        // Redirect to the equivalent path for their role if possible
        if (pathname.startsWith(`/${role}/dashboard`)) {
          url.pathname = `/${userRole}/dashboard`
          return NextResponse.redirect(url)
        }

        // Otherwise redirect to their dashboard
        url.pathname = `/${userRole}/dashboard`
        return NextResponse.redirect(url)
      }
    }
  }

  // Handle common authenticated paths
  if (COMMON_AUTH_PATHS.includes(pathname) && !userRole) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Check if path is cacheable
  const isCacheablePath = CACHEABLE_PATHS.includes(pathname)

  // Check if request is for a static asset
  const isStaticAsset = STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname))

  // Set cache headers for cacheable paths and static assets
  if (isCacheablePath || isStaticAsset) {
    const response = NextResponse.next()

    // Set cache control headers
    response.headers.set(
      "Cache-Control",
      isStaticAsset
        ? "public, max-age=31536000, immutable" // 1 year for static assets
        : "public, s-maxage=60, stale-while-revalidate=600", // 1 minute with 10 minute stale-while-revalidate
    )

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except for API routes that require authentication
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
