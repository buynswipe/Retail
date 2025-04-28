"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "./product-service"
import { useOffline } from "./offline-context"
import offlineSupabase from "./offline-supabase-client"
import indexedDBService from "./indexed-db"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase-client"

export interface CartItem {
  product: Product
  quantity: number
  id?: string
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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [wholesalerName, setWholesalerName] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { user } = useAuth()
  const { isOnline } = useOffline()

  // Add this function to save cart items to IndexedDB
  const saveCartToIndexedDB = async (items: CartItem[]) => {
    if (user) {
      await indexedDBService.storeOfflineData(`cart:${user.id}`, items)
    }
  }

  // Modify the useEffect to load cart items from IndexedDB when offline
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        setCartItems([])
        return
      }

      try {
        if (isOnline) {
          const { data, error } = await supabase
            .from("cart_items")
            .select("*, product:product_id(*)")
            .eq("user_id", user.id)

          if (error) {
            console.error("Error loading cart:", error)
            return
          }

          const cartItems = data.map((item) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
          }))

          setCartItems(cartItems)

          // Also save to IndexedDB for offline use
          await saveCartToIndexedDB(cartItems)
        } else {
          // Load from IndexedDB when offline
          const offlineCart = await indexedDBService.getOfflineData(`cart:${user.id}`)
          if (offlineCart) {
            setCartItems(offlineCart)
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }

    loadCart()
  }, [user, isOnline])

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
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    setWholesalerId(null)
    setWholesalerName(null)
  }

  const setWholesaler = (id: string, name: string) => {
    // If changing wholesaler, clear the cart
    if (wholesalerId && wholesalerId !== id) {
      setItems([])
    }
    setWholesalerId(id)
    setWholesalerName(name)
  }

  // Calculate total items and amount
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addToCart = async (product: Product, quantity = 1) => {
    if (!user) return

    const existingCartItem = cartItems.find((item) => item.product.id === product.id)

    let updatedCartItems: CartItem[]

    if (existingCartItem) {
      updatedCartItems = cartItems.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
      )
    } else {
      const newCartItem: CartItem = {
        id: `temp_${Date.now()}`,
        product,
        quantity,
      }
      updatedCartItems = [...cartItems, newCartItem]
    }

    setCartItems(updatedCartItems)

    // Save to IndexedDB for offline use
    await saveCartToIndexedDB(updatedCartItems)

    if (isOnline) {
      try {
        if (existingCartItem) {
          await supabase
            .from("cart_items")
            .update({
              quantity: existingCartItem.quantity + quantity,
            })
            .eq("id", existingCartItem.id)
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
          })
        }
      } catch (error) {
        console.error("Error updating cart:", error)
      }
    } else {
      // Queue the operation for when we're back online
      if (existingCartItem) {
        await offlineSupabase.update({
          table: "cart_items",
          data: {
            quantity: existingCartItem.quantity + quantity,
          },
          match: { id: existingCartItem.id },
        })
      } else {
        await offlineSupabase.insert({
          table: "cart_items",
          data: {
            user_id: user.id,
            product_id: product.id,
            quantity,
          },
        })
      }
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user) return

    const existingCartItem = cartItems.find((item) => item.product.id === productId)

    if (!existingCartItem) return

    const updatedCartItems = cartItems.filter((item) => item.product.id !== productId)

    setCartItems(updatedCartItems)

    await saveCartToIndexedDB(updatedCartItems)

    if (isOnline) {
      try {
        await supabase.from("cart_items").delete().eq("id", existingCartItem.id)
      } catch (error) {
        console.error("Error removing from cart:", error)
      }
    } else {
      await offlineSupabase.delete({
        table: "cart_items",
        match: { id: existingCartItem.id },
      })
    }
  }

  const updateCartItemQuantity = async (productId: string, quantity: number) => {
    if (!user) return

    const existingCartItem = cartItems.find((item) => item.product.id === productId)

    if (!existingCartItem) return

    const updatedCartItems = cartItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item))

    setCartItems(updatedCartItems)

    await saveCartToIndexedDB(updatedCartItems)

    if (isOnline) {
      try {
        await supabase.from("cart_items").update({ quantity }).eq("id", existingCartItem.id)
      } catch (error) {
        console.error("Error updating cart item quantity:", error)
      }
    } else {
      await offlineSupabase.update({
        table: "cart_items",
        data: { quantity },
        match: { id: existingCartItem.id },
      })
    }
  }

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
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
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
