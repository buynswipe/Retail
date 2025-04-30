import type { UserRole } from "./types"

// Dashboard paths by role
export const DASHBOARD_PATHS: Record<UserRole, string> = {
  retailer: "/retailer/dashboard",
  wholesaler: "/wholesaler/dashboard",
  delivery: "/delivery/dashboard",
  admin: "/admin/dashboard",
}

// Default fallback paths by role (used when a specific path doesn't exist for a role)
export const FALLBACK_PATHS: Record<UserRole, string> = {
  retailer: "/retailer/dashboard",
  wholesaler: "/wholesaler/dashboard",
  delivery: "/delivery/dashboard",
  admin: "/admin/dashboard",
}

/**
 * Get the dashboard path for a specific user role
 * @param role User role
 * @param fallbackPath Fallback path if role is not provided
 * @returns Dashboard path
 */
export function getDashboardPath(role?: UserRole, fallbackPath = "/"): string {
  if (!role) return fallbackPath
  return DASHBOARD_PATHS[role] || fallbackPath
}

/**
 * Get a role-specific path or fallback to the dashboard if it doesn't exist
 * @param basePath Base path without role prefix
 * @param role User role
 * @param fallbackPath Fallback path if role-specific path doesn't exist
 * @returns Role-specific path or fallback
 */
export function getRolePath(basePath: string, role?: UserRole, fallbackPath?: string): string {
  if (!role) return fallbackPath || "/"

  // If the path already starts with the role, return it
  if (basePath.startsWith(`/${role}`)) {
    return basePath
  }

  // Try to construct a role-specific path
  const rolePath = `/${role}${basePath.startsWith("/") ? basePath : `/${basePath}`}`

  // Return the role path or fallback to the dashboard
  return rolePath || (fallbackPath ?? DASHBOARD_PATHS[role])
}

/**
 * Safe navigation helper that ensures the path exists for the user's role
 * @param path Desired path
 * @param role User role
 * @returns Safe path that exists for the user's role
 */
export function getSafePath(path: string, role?: UserRole): string {
  if (!role) return "/"

  // If path is the root, return the dashboard
  if (path === "/") {
    return DASHBOARD_PATHS[role]
  }

  // If path already includes the role, it's likely valid
  if (path.includes(`/${role}/`)) {
    return path
  }

  // For common paths that should redirect to role-specific versions
  if (path === "/profile") {
    return "/profile" // Centralized profile page
  }

  if (path === "/notifications") {
    return "/notifications" // Centralized notifications page
  }

  if (path === "/settings") {
    return `/${role}/settings`
  }

  // For other paths, try to make them role-specific or fallback to dashboard
  return getRolePath(path, role, DASHBOARD_PATHS[role])
}
