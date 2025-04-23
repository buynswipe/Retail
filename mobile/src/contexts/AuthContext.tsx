"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"

type UserType = {
  id: string
  name: string
  phone: string
  role: "retailer" | "wholesaler" | "delivery" | "admin"
  businessName?: string
  pinCode?: string
  gstNumber?: string
}

type AuthContextType = {
  user: UserType | null
  isLoading: boolean
  login: (phone: string) => Promise<{ success: boolean; error?: string }>
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>
  signup: (phone: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<UserType>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on app start
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (phone: string) => {
    try {
      // In a real app, this would call the Supabase function to send OTP
      // For demo, we'll simulate success
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Failed to send OTP. Please try again." }
    }
  }

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      // In a real app, this would verify the OTP with Supabase
      // For demo, we'll accept any 6-digit OTP and return mock user data
      if (otp.length !== 6) {
        return { success: false, error: "Invalid OTP. Please enter a 6-digit code." }
      }

      // Mock user data based on phone number
      let mockUser: UserType

      if (phone === "1234567890") {
        mockUser = {
          id: "admin-id",
          name: "Admin User",
          phone,
          role: "admin",
        }
      } else if (phone === "9876543210") {
        mockUser = {
          id: "retailer-id",
          name: "Retailer User",
          phone,
          role: "retailer",
          businessName: "My Retail Store",
          pinCode: "400001",
        }
      } else if (phone === "9876543211") {
        mockUser = {
          id: "wholesaler-id",
          name: "Wholesaler User",
          phone,
          role: "wholesaler",
          businessName: "My Wholesale Business",
          pinCode: "400002",
          gstNumber: "22AAAAA0000A1Z5",
        }
      } else if (phone === "9876543212") {
        mockUser = {
          id: "delivery-id",
          name: "Delivery Partner",
          phone,
          role: "delivery",
          pinCode: "400003",
        }
      } else {
        // Default to retailer for any other number
        mockUser = {
          id: "new-user-id",
          name: "New User",
          phone,
          role: "retailer",
        }
      }

      // Store user data
      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)

      return { success: true }
    } catch (error) {
      console.error("OTP verification error:", error)
      return { success: false, error: "Failed to verify OTP. Please try again." }
    }
  }

  const signup = async (phone: string, role: string) => {
    try {
      // In a real app, this would create a new user in Supabase
      // For demo, we'll just return success
      return { success: true }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Failed to create account. Please try again." }
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      Alert.alert("Error", "Failed to log out. Please try again.")
    }
  }

  const updateUserProfile = async (data: Partial<UserType>) => {
    try {
      if (!user) {
        return { success: false, error: "User not logged in" }
      }

      // Update local user data
      const updatedUser = { ...user, ...data }
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      // In a real app, this would also update the user data in Supabase
      return { success: true }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: "Failed to update profile. Please try again." }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyOtp,
        signup,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
