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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get response
  const response = getResponse(request)

  // Add security headers
  addSecurityHeaders(response)

  return response
}

function getResponse(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Skip API routes except health check
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/health")) {
    return NextResponse.next()
  }

  // Get user info from cookies
  const userRole = request.cookies.get("userRole")?.value

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

function addSecurityHeaders(response: NextResponse): void {
  // Basic security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")

  // Content Security Policy
  // Generate a nonce for script execution (in a real app, this would be random per request)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const csp = [
    // Default to nothing
    "default-src 'none'",
    // Allow self-hosted resources
    "script-src 'self' 'unsafe-inline' https://vercel.live *.vercel.app",
    "style-src 'self' 'unsafe-inline'",
    // Connect sources for APIs
    "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com",
    // Image sources
    "img-src 'self' data: blob: https:",
    // Font sources
    "font-src 'self' https://fonts.gstatic.com",
    // Form action destinations
    "form-action 'self'",
    // Frame sources
    "frame-src 'self'",
    // Manifest sources
    "manifest-src 'self'",
    // Media sources
    "media-src 'self' blob:",
    // Worker sources
    "worker-src 'self' blob:",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)
}

export const config = {
  matcher: [
    // Match all paths except for specific static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
}
