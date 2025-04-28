import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/login" || path === "/signup" || path.startsWith("/onboarding/")

  // Check if user is logged in
  const hasAuthCookie = request.cookies.has("currentUser")

  // If trying to access a protected route without being logged in
  if (!isPublicPath && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If trying to access login/signup while logged in
  if ((path === "/login" || path === "/signup") && hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
