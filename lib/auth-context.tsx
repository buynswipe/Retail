"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCurrentUser, signOut, type UserData } from "./auth-service"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  setUser: (user: UserData | null) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
}

// Create a default context value
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  setUser: () => {},
  logout: async () => {},
  isAuthenticated: false,
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()

        // Ensure the user object has all the properties we need
        if (currentUser && !currentUser.role) {
          // If role is missing, try to determine it from other properties
          // This is a fallback for demo data
          if (currentUser.email?.includes("wholesaler") || currentUser.name?.includes("Wholesaler")) {
            currentUser.role = "wholesaler"
          } else if (currentUser.email?.includes("retailer") || currentUser.name?.includes("Retailer")) {
            currentUser.role = "retailer"
          } else if (currentUser.email?.includes("delivery") || currentUser.name?.includes("Delivery")) {
            currentUser.role = "delivery"
          } else if (currentUser.email?.includes("admin") || currentUser.name?.includes("Admin")) {
            currentUser.role = "admin"
          }
        }

        setUser(currentUser)
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      // Redirect to login page after logout
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Add isAuthenticated property
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  // Return the context directly - it will use the default value if outside provider
  return context
}
