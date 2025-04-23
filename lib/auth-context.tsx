"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser, signOut, type UserData } from "./auth-service"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  setUser: (user: UserData | null) => void
  logout: () => Promise<void>
  error: Error | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: async () => {},
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setError(null)
      } catch (err) {
        console.error("Error loading user:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  async function logout() {
    try {
      const { success } = await signOut()
      if (success) {
        setUser(null)
        router.push("/login")
      }
    } catch (err) {
      console.error("Error logging out:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, setUser, logout, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
