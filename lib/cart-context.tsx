"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Product } from "./types"
import { useOffline } from "./offline-context"
import indexedDBService from "./indexed-db"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { generateDemoProducts } from "./demo-data-service"

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
  const { isOnline, isOffline } = useOffline()
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
    if (!user) return

    // If we're in offline mode or using a demo user, use demo data
    if (isOffline || user.id.startsWith("user-")) {
      console.log("Using demo cart data")
      // Generate some demo cart items
      const demoProducts = generateDemoProducts().slice(0, 3)
      const demoCartItems = demoProducts.map((product) => ({
        id: `cart-${product.id}`,
        product_id: product.id,
        quantity: Math.floor(Math.random() * 5) + 1,
        product,
      }))

      setItems(demoCartItems)

      if (demoProducts.length > 0) {
        setWholesalerId(demoProducts[0].wholesaler_id)
        setWholesalerName("Demo Wholesaler")
      }

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000))

      // Try to fetch cart items, but handle the case where the table doesn't exist
      const fetchPromise = supabase
        .from("cart_items")
        .select(`
          id, 
          user_id, 
          product_id, 
          quantity
        `)
        .eq("user_id", user.id)

      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error("Request timed out")
        }),
      ])

      // If the table doesn't exist, use demo data
      if (error && error.message.includes("does not exist")) {
        console.log("Cart items table doesn't exist, using demo data")
        const demoProducts = generateDemoProducts().slice(0, 3)
        const demoCartItems = demoProducts.map((product) => ({
          id: `cart-${product.id}`,
          product_id: product.id,
          quantity: Math.floor(Math.random() * 5) + 1,
          product,
        }))

        setItems(demoCartItems)

        if (demoProducts.length > 0) {
          setWholesalerId(demoProducts[0].wholesaler_id)
          setWholesalerName("Demo Wholesaler")
        }

        return
      } else if (error) {
        throw error
      }

      if (data && data.length > 0) {
        // Get all product IDs from cart items
        const productIds = data.map((item) => item.product_id)

        // Fetch products for these IDs
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds)

        if (productsError) {
          throw productsError
        }

        // Create a map of products by ID for easy lookup
        const productsMap = {}
        if (productsData) {
          productsData.forEach((product) => {
            productsMap[product.id] = product
          })
        }

        // Get wholesaler info if we have products
        if (productsData && productsData.length > 0) {
          const firstProduct = productsData[0]
          if (firstProduct && firstProduct.wholesaler_id) {
            try {
              // Get wholesaler name with timeout
              const wholesalerPromise = supabase
                .from("users")
                .select("business_name")
                .eq("id", firstProduct.wholesaler_id)
                .single()

              const { data: wholesalerData, error: wholesalerError } = await Promise.race([
                wholesalerPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Wholesaler request timed out")), 5000)),
              ])

              if (!wholesalerError && wholesalerData) {
                setWholesalerId(firstProduct.wholesaler_id)
                setWholesalerName(wholesalerData.business_name)
              }
            } catch (wholesalerError) {
              console.error("Error fetching wholesaler info:", wholesalerError)
              // Continue with cart items even if wholesaler info fails
            }
          }
        }

        // Transform data to CartItem format
        const cartItems: CartItem[] = data
          .filter((item) => productsMap[item.product_id]) // Filter out items with missing products
          .map((item) => ({
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            quantity: item.quantity,
            product: productsMap[item.product_id],
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
  }, [user, isOffline, retryCount, maxRetries])

  // Manual retry function
  const retryLoadCart = async () => {
    setRetryCount(0)
    return loadCartFromServer()
  }

  // Load cart from server when user logs in
  useEffect(() => {
    loadCartFromServer()
  }, [user, loadCartFromServer])

  // Load cart from IndexedDB when offline
  useEffect(() => {
    const loadCartFromIndexedDB = async () => {
      if (user && isOffline) {
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
  }, [user, isOffline, toast])

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
    if (isOnline && user && !user.id.startsWith("user-")) {
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
    if (isOnline && user && !user.id.startsWith("user-")) {
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
    if (isOnline && user && !user.id.startsWith("user-")) {
      syncCartItem(productId, quantity, true)
    }
  }

  const clearCart = () => {
    setItems([])
    setWholesalerId(null)
    setWholesalerName(null)

    // If online, clear server cart
    if (isOnline && user && !user.id.startsWith("user-")) {
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
    if (!user || isOffline || user.id.startsWith("user-")) return

    try {
      // Check if cart_items table exists
      const { error: tableCheckError } = await supabase.from("cart_items").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Cart items table doesn't exist, skipping sync")
        return
      }

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
    if (!user || isOffline || user.id.startsWith("user-")) return

    try {
      // Check if cart_items table exists
      const { error: tableCheckError } = await supabase.from("cart_items").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.log("Cart items table doesn't exist, skipping clear")
        return
      }

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
