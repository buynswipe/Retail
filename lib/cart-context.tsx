"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Product } from "./types"

// Define the cart item type
export interface CartItem {
  id?: string
  user_id: string
  product_id: string
  quantity: number
  product?: Product
  created_at?: string
  updated_at?: string
}

// Define the cart context type
interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartItem: (item: CartItem) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  items?: CartItem[] // Alias for cartItems for backward compatibility
  addItem?: (product: Product, quantity: number) => void // Simplified add method
  updateQuantity?: (productId: string, quantity: number) => void // Simplified update method
  wholesalerId?: string // Current wholesaler ID
  wholesalerName?: string // Current wholesaler name
  totalAmount?: number // Alias for cartTotal
}

// Create the cart context with default values
const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartItem: () => {},
  clearCart: () => {},
  cartTotal: 0,
  cartCount: 0,
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  wholesalerId: "",
  wholesalerName: "",
  totalAmount: 0,
})

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext)

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [wholesalerId, setWholesalerId] = useState<string>("")
  const [wholesalerName, setWholesalerName] = useState<string>("")

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCartItems(parsedCart)
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }, [])

  // Update localStorage whenever cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cartItems))
    } else {
      localStorage.removeItem("cart")
    }

    // Calculate cart total
    const total = cartItems.reduce((sum, item) => {
      const price = item.product?.price || 0
      return sum + price * item.quantity
    }, 0)
    setCartTotal(total)

    // Calculate cart count
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(count)
  }, [cartItems])

  // Add item to cart
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.product_id === item.product_id)

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity,
        }
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, item]
      }
    })
  }

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product_id !== productId))
  }

  // Update cart item
  const updateCartItem = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.product_id === item.product_id)

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          ...item,
        }
        return updatedItems
      }

      return prevItems
    })
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem("cart")
  }

  // Simplified add item method that matches the interface expected by product detail page
  const addItem = (product: Product, quantity: number) => {
    if (!product) return

    const item: CartItem = {
      user_id: "current-user", // This will be replaced with actual user ID when available
      product_id: product.id,
      quantity: quantity,
      product: product,
    }

    addToCart(item)

    // If this is the first item, set the wholesaler info
    if (cartItems.length === 0 && product.wholesaler_id) {
      setWholesalerId(product.wholesaler_id)
      setWholesalerName(product.wholesaler_name || "Wholesaler")
    }
  }

  // Simplified update quantity method
  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.product_id === productId)

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: quantity,
        }
        return updatedItems
      }

      return prevItems
    })
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        cartTotal,
        cartCount,
        // Aliases and additional properties for backward compatibility
        items: cartItems,
        addItem,
        updateQuantity,
        wholesalerId,
        wholesalerName,
        totalAmount: cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
