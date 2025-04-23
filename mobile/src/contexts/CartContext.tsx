"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  wholesaler_id: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  wholesalerId: string | null
  wholesalerName: string | null
  totalItems: number
  totalAmount: number
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setWholesaler: (id: string, name: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [wholesalerName, setWholesalerName] = useState<string | null>(null)

  // Load cart from AsyncStorage on app start
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await AsyncStorage.getItem("cart")
        if (cartData) {
          const { items, wholesalerId, wholesalerName } = JSON.parse(cartData)
          setItems(items || [])
          setWholesalerId(wholesalerId)
          setWholesalerName(wholesalerName)
        }
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }

    loadCart()
  }, [])

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        const cartData = JSON.stringify({
          items,
          wholesalerId,
          wholesalerName,
        })
        await AsyncStorage.setItem("cart", cartData)
      } catch (error) {
        console.error("Error saving cart:", error)
      }
    }

    saveCart()
  }, [items, wholesalerId, wholesalerName])

  const addItem = (product: Product, quantity: number) => {
    // If cart is empty or adding from the same wholesaler
    if (items.length === 0 || product.wholesaler_id === wholesalerId) {
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

      // Set wholesaler if not already set
      if (!wholesalerId) {
        setWholesalerId(product.wholesaler_id)
        // In a real app, you would fetch the wholesaler name from the API
        setWholesalerName("Wholesaler")
      }
    } else {
      // Show error or confirmation dialog for changing wholesaler
      // For simplicity, we'll just clear the cart and add the new item
      setItems([{ product, quantity }])
      setWholesalerId(product.wholesaler_id)
      // In a real app, you would fetch the wholesaler name from the API
      setWholesalerName("Wholesaler")
    }
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // If removing the last item, clear wholesaler info
    if (items.length === 1 && items[0].product.id === productId) {
      setWholesalerId(null)
      setWholesalerName(null)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    setWholesalerId(null)
    setWholesalerName(null)
  }

  const setWholesaler = (id: string, name: string) => {
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
        totalItems,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setWholesaler,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
