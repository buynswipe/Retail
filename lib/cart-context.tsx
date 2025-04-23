"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "./product-service"

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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [wholesalerName, setWholesalerName] = useState<string | null>(null)

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      const savedWholesalerId = localStorage.getItem("wholesalerId")
      const savedWholesalerName = localStorage.getItem("wholesalerName")

      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
      if (savedWholesalerId) {
        setWholesalerId(savedWholesalerId)
      }
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
