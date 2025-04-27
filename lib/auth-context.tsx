"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "./supabase"
import { useRouter } from "next/navigation"

export type UserData = {
  id: string
  phone?: string
  email?: string
  role: string
  name?: string
  businessName?: string
  pinCode?: string
  isApproved: boolean
}

type AuthContextType = {
  user: UserData | null
  setUser: (user: UserData | null) => void
  login: (userData: UserData) => void
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: () => {},
  logout: async () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking session:", error)
          setIsLoading(false)
          return
        }

        if (data?.session) {
          // Get user profile data
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.session.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user data:", userError)
            setIsLoading(false)
            return
          }

          if (userData) {
            setUser({
              id: userData.id,
              phone: userData.phone_number,
              email: userData.email,
              role: userData.role,
              name: userData.name,
              businessName: userData.business_name,
              pinCode: userData.pin_code,
              isApproved: userData.is_approved,
            })
          }
        }
      } catch (error) {
        console.error("Error in auth check:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Get user profile data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          return
        }

        if (userData) {
          setUser({
            id: userData.id,
            phone: userData.phone_number,
            email: userData.email,
            role: userData.role,
            name: userData.name,
            businessName: userData.business_name,
            pinCode: userData.pin_code,
            isApproved: userData.is_approved,
          })
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Login function to set user data
  const login = (userData: UserData) => {
    console.log("Setting user data:", userData)
    setUser(userData)

    // Store in localStorage for persistence
    try {
      localStorage.setItem("retailbandhu_user", JSON.stringify(userData))
    } catch (error) {
      console.error("Error storing user data:", error)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem("retailbandhu_user")
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
