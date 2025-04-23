"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCurrentUser, signOut, type UserData } from "./auth-service"

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  setUser: (user: UserData | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
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
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
