"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "./types"
import { useOffline } from "./offline-context"
import indexedDBService from "./indexed-db"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase-client"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  wholesalerId: string | null
  wholesalerName: string | null
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setWholesaler: (id: string, name: string) => void
  totalItems: number
  totalAmount: number
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [wholesalerName, setWholesalerName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { isOnline } = useOffline()

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      // Load cart items
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }

      // Load wholesaler info
      const savedWholesalerId = localStorage.getItem("wholesalerId")
      if (savedWholesalerId) {
        setWholesalerId(savedWholesalerId)
      }

      const savedWholesalerName = localStorage.getItem("wholesalerName")
      if (savedWholesalerName) {
        setWholesalerName(savedWholesalerName)
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items))
    } catch (error) {
      console.error("Error saving cart to localStorage:", error)
    }
  }, [items])

  // Save wholesaler info to localStorage whenever it changes
  useEffect(() => {
    try {
      if (wholesalerId) {
        localStorage.setItem("wholesalerId", wholesalerId)
      } else {
        localStorage.removeItem("wholesalerId")
      }

      if (wholesalerName) {
        localStorage.setItem("wholesalerName", wholesalerName)
      } else {
        localStorage.removeItem("wholesalerName")
      }
    } catch (error) {
      console.error("Error saving wholesaler info to localStorage:", error)
    }
  }, [wholesalerId, wholesalerName])

  // Save cart to IndexedDB for offline use
  useEffect(() => {
    const saveCartToIndexedDB = async () => {
      if (user) {
        try {
          await indexedDBService.storeOfflineData(`cart:${user.id}`, {
            items,
            wholesalerId,
            wholesalerName,
          })
        } catch (error) {
          console.error("Error saving cart to IndexedDB:", error)
        }
      }
    }

    saveCartToIndexedDB()
  }, [items, wholesalerId, wholesalerName, user])

  // Load cart from server when user logs in
  useEffect(() => {
    const loadCartFromServer = async () => {
      if (user && isOnline) {
        setIsLoading(true)
        try {
          const { data, error } = await supabase
            .from("cart_items")
            .select("*, product:product_id(*)")
            .eq("user_id", user.id)

          if (error) {
            console.error("Error loading cart from server:", error)
            return
          }

          if (data && data.length > 0) {
            // Get wholesaler info from the first item
            const firstItem = data[0]
            if (firstItem.product && firstItem.product.wholesaler_id) {
              // Get wholesaler name
              const { data: wholesalerData, error: wholesalerError } = await supabase
                .from("users")
                .select("business_name")
                .eq("id", firstItem.product.wholesaler_id)
                .single()

              if (!wholesalerError && wholesalerData) {
                setWholesalerId(firstItem.product.wholesaler_id)
                setWholesalerName(wholesalerData.business_name)
              }
            }

            // Transform data to CartItem format
            const cartItems: CartItem[] = data
              .filter((item) => item.product) // Filter out items with missing products
              .map((item) => ({
                product: item.product,
                quantity: item.quantity,
              }))

            setItems(cartItems)
          }
        } catch (error) {
          console.error("Error loading cart from server:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadCartFromServer()
  }, [user, isOnline])

  const addItem = (product: Product, quantity: number) => {
    setItems((prevItems) => {
      // Check if the product is already in the cart
      const existingItemIndex = prevItems.findIndex((item) => item.product.id === product.id)

      if (existingItemIndex >= 0) {
        // Update quantity if product already exists
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, { product, quantity }]
      }
    })

    // If online, sync with server
    if (isOnline && user) {
      syncCartItem(product.id, quantity, true)
    }
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // If online, sync with server
    if (isOnline && user) {
      syncCartItem(productId, 0, false)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))

    // If online, sync with server
    if (isOnline && user) {
      syncCartItem(productId, quantity, true)
    }
  }

  const clearCart = () => {
    setItems([])
    setWholesalerId(null)
    setWholesalerName(null)

    // If online, clear server cart
    if (isOnline && user) {
      clearServerCart()
    }
  }

  const setWholesaler = (id: string, name: string) => {
    // If changing wholesaler, clear the cart
    if (wholesalerId && wholesalerId !== id) {
      setItems([])
    }
    setWholesalerId(id)
    setWholesalerName(name)
  }

  // Sync cart item with server
  const syncCartItem = async (productId: string, quantity: number, isAdd: boolean) => {
    if (!user) return

    try {
      // Check if item exists in server cart
      const { data: existingItems } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (existingItems && existingItems.length > 0) {
        // Item exists, update or delete
        if (quantity > 0) {
          await supabase.from("cart_items").update({ quantity }).eq("id", existingItems[0].id)
        } else {
          await supabase.from("cart_items").delete().eq("id", existingItems[0].id)
        }
      } else if (isAdd && quantity > 0) {
        // Item doesn't exist, add it
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })
      }
    } catch (error) {
      console.error("Error syncing cart with server:", error)
    }
  }

  // Clear server cart
  const clearServerCart = async () => {
    if (!user) return

    try {
      await supabase.from("cart_items").delete().eq("user_id", user.id)
    } catch (error) {
      console.error("Error clearing server cart:", error)
    }
  }

  // Calculate total items and amount
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        wholesalerId,
        wholesalerName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setWholesaler,
        totalItems,
        totalAmount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
