"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { Product } from "./supabase-client"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  wholesalerId: string | null
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setWholesalerId: (id: string | null) => void
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  wholesalerId: null,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  setWholesalerId: () => {},
  totalItems: 0,
  totalAmount: 0,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      const savedWholesalerId = localStorage.getItem("wholesalerId")

      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }

      if (savedWholesalerId) {
        setWholesalerId(savedWholesalerId)
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

  // Save wholesalerId to localStorage whenever it changes
  useEffect(() => {
    try {
      if (wholesalerId) {
        localStorage.setItem("wholesalerId", wholesalerId)
      } else {
        localStorage.removeItem("wholesalerId")
      }
    } catch (error) {
      console.error("Error saving wholesalerId to localStorage:", error)
    }
  }, [wholesalerId])

  // Add item to cart
  const addItem = (product: Product, quantity: number) => {
    // Check if product is from the same wholesaler
    if (wholesalerId && product.wholesaler_id !== wholesalerId) {
      // Clear cart if adding product from a different wholesaler
      setItems([{ product, quantity }])
      setWholesalerId(product.wholesaler_id)
      return
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        // Add new item
        return [...prevItems, { product, quantity }]
      }
    })

    // Set wholesalerId if not already set
    if (!wholesalerId) {
      setWholesalerId(product.wholesaler_id)
    }
  }

  // Remove item from cart
  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // Clear wholesalerId if cart is empty
    if (items.length === 1 && items[0].product.id === productId) {
      setWholesalerId(null)
    }
  }

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  // Clear cart
  const clearCart = () => {
    setItems([])
    setWholesalerId(null)
  }

  // Calculate total items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  // Calculate total amount
  const totalAmount = items.reduce((total, item) => total + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        wholesalerId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setWholesalerId,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
