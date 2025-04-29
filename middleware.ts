import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define cacheable paths
const CACHEABLE_PATHS = ["/", "/login", "/signup", "/about", "/faq", "/help", "/contact"]

// Define static asset patterns
const STATIC_ASSET_PATTERNS = [/\.(jpg|jpeg|png|gif|svg|webp|avif)$/, /\.(css|js)$/, /^\/fonts\//, /^\/icons\//]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes and authenticated routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/retailer/") ||
    pathname.startsWith("/wholesaler/") ||
    pathname.startsWith("/delivery/") ||
    pathname.startsWith("/admin/")
  ) {
    return NextResponse.next()
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
