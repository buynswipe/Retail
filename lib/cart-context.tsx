"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Product } from "./types"
import { useOffline } from "./offline-context"
import indexedDBService from "./indexed-db"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase-client"
import { useToast } from "@/components/ui/use-toast"

export interface CartItem {
  id?: string
  user_id?: string
  product_id: string
  quantity: number
  product: Product
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
  error: string | null
  retryLoadCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [wholesalerName, setWholesalerName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { user } = useAuth()
  const { isOnline } = useOffline()
  const { toast } = useToast()
  const maxRetries = 3

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
      // Fall back to empty cart on localStorage error
      setItems([])
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
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("Error saving cart to IndexedDB:", error)
        }
      }
    }

    saveCartToIndexedDB()
  }, [items, wholesalerId, wholesalerName, user])

  // Function to load cart from server with retry logic
  const loadCartFromServer = useCallback(async () => {
    if (!user || !isOnline) return

    setIsLoading(true)
    setError(null)

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000))

      const fetchPromise = supabase.from("cart_items").select("*, product:product_id(*)").eq("user_id", user.id)

      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error("Request timed out")
        }),
      ])

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        // Get wholesaler info from the first item
        const firstItem = data[0]
        if (firstItem.product && firstItem.product.wholesaler_id) {
          try {
            // Get wholesaler name with timeout
            const wholesalerPromise = supabase
              .from("users")
              .select("business_name")
              .eq("id", firstItem.product.wholesaler_id)
              .single()

            const { data: wholesalerData, error: wholesalerError } = await Promise.race([
              wholesalerPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error("Wholesaler request timed out")), 5000)),
            ])

            if (!wholesalerError && wholesalerData) {
              setWholesalerId(firstItem.product.wholesaler_id)
              setWholesalerName(wholesalerData.business_name)
            }
          } catch (wholesalerError) {
            console.error("Error fetching wholesaler info:", wholesalerError)
            // Continue with cart items even if wholesaler info fails
          }
        }

        // Transform data to CartItem format
        const cartItems: CartItem[] = data
          .filter((item) => item.product) // Filter out items with missing products
          .map((item) => ({
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            quantity: item.quantity,
            product: item.product,
          }))

        setItems(cartItems)
        setRetryCount(0) // Reset retry count on success
      }
    } catch (error) {
      console.error("Error loading cart from server:", error)
      setError("Failed to load your cart. Please try again.")

      // Implement exponential backoff for retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        console.log(`Retrying cart load in ${delay}ms...`)
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
          loadCartFromServer()
        }, delay)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, isOnline, retryCount, maxRetries])

  // Manual retry function
  const retryLoadCart = async () => {
    setRetryCount(0)
    return loadCartFromServer()
  }

  // Load cart from server when user logs in
  useEffect(() => {
    loadCartFromServer()
  }, [user, isOnline, loadCartFromServer])

  // Load cart from IndexedDB when offline
  useEffect(() => {
    const loadCartFromIndexedDB = async () => {
      if (user && !isOnline) {
        setIsLoading(true)
        try {
          const offlineCart = await indexedDBService.getOfflineData(`cart:${user.id}`)
          if (offlineCart) {
            setItems(offlineCart.items || [])
            setWholesalerId(offlineCart.wholesalerId || null)
            setWholesalerName(offlineCart.wholesalerName || null)
          }
        } catch (error) {
          console.error("Error loading cart from IndexedDB:", error)
          toast({
            title: "Error",
            description: "Failed to load your offline cart data",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadCartFromIndexedDB()
  }, [user, isOnline, toast])

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
        return [...prevItems, { product_id: product.id, product, quantity }]
      }
    })

    // If online, sync with server
    if (isOnline && user) {
      syncCartItem(product.id, quantity, true)
    }

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    })
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // If online, sync with server
    if (isOnline && user) {
      syncCartItem(productId, 0, false)
    }

    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    })
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

    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    })
  }

  const setWholesaler = (id: string, name: string) => {
    // If changing wholesaler, clear the cart
    if (wholesalerId && wholesalerId !== id) {
      setItems([])
      toast({
        title: "Cart cleared",
        description: "Cart items were cleared because you switched wholesalers",
      })
    }
    setWholesalerId(id)
    setWholesalerName(name)
  }

  // Sync cart item with server with improved error handling
  const syncCartItem = async (productId: string, quantity: number, isAdd: boolean) => {
    if (!user || !isOnline) return

    try {
      // Check if item exists in server cart
      const { data: existingItems, error: fetchError } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (fetchError) {
        throw fetchError
      }

      if (existingItems && existingItems.length > 0) {
        // Item exists, update or delete
        if (quantity > 0) {
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ quantity })
            .eq("id", existingItems[0].id)

          if (updateError) throw updateError
        } else {
          const { error: deleteError } = await supabase.from("cart_items").delete().eq("id", existingItems[0].id)

          if (deleteError) throw deleteError
        }
      } else if (isAdd && quantity > 0) {
        // Item doesn't exist, add it
        const { error: insertError } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })

        if (insertError) throw insertError
      }
    } catch (error) {
      console.error("Error syncing cart with server:", error)
      // Store failed operation for later sync
      try {
        await indexedDBService.storePendingOperation({
          type: quantity > 0 ? "upsert_cart_item" : "delete_cart_item",
          data: {
            user_id: user.id,
            product_id: productId,
            quantity,
          },
          timestamp: new Date().toISOString(),
        })
      } catch (storageError) {
        console.error("Error storing pending operation:", storageError)
      }
    }
  }

  // Clear server cart with improved error handling
  const clearServerCart = async () => {
    if (!user || !isOnline) return

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

      if (error) throw error
    } catch (error) {
      console.error("Error clearing server cart:", error)
      // Store failed operation for later sync
      try {
        await indexedDBService.storePendingOperation({
          type: "clear_cart",
          data: {
            user_id: user.id,
          },
          timestamp: new Date().toISOString(),
        })
      } catch (storageError) {
        console.error("Error storing pending operation:", storageError)
      }
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
        error,
        retryLoadCart,
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
