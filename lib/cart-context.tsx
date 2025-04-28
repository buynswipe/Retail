"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "./types"
import { useAuth } from "./auth-context"
import { useOffline } from "./offline-context"
import { getProductById } from "./product-service"

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
  itemCount: number
  total: number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [wholesalerId, setWholesalerId] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { user } = useAuth()
  const { isOffline, syncOnline } = useOffline()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    if (user?.role === "retailer") {
      const savedCart = localStorage.getItem(`cart_${user.id}`)
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setItems(parsedCart.items || [])
          setWholesalerId(parsedCart.wholesalerId || null)
        } catch (error) {
          console.error("Failed to parse saved cart:", error)
        }
      }
    }
  }, [user])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (user?.role === "retailer") {
      localStorage.setItem(
        `cart_${user.id}`,
        JSON.stringify({
          items,
          wholesalerId,
        }),
      )
    }
  }, [items, wholesalerId, user])

  const addItem = (product: Product, quantity: number) => {
    if (quantity <= 0) return

    // If cart is empty, set the wholesaler ID
    if (items.length === 0) {
      setWholesalerId(product.wholesaler_id)
    }
    // If trying to add a product from a different wholesaler, show error
    else if (wholesalerId && product.wholesaler_id !== wholesalerId) {
      alert("You can only add products from the same wholesaler in a single order.")
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
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    // If cart becomes empty, reset wholesaler ID
    if (items.length === 1) {
      setWholesalerId(null)
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
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  const total = items.reduce((total, item) => total + item.product.price * item.quantity, 0)

  // Sync cart with online data when coming back online
  useEffect(() => {
    if (!isOffline && items.length > 0) {
      const syncCartProducts = async () => {
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              // Get the latest product data (especially stock quantity)
              const { data: freshProduct } = await getProductById(item.product.id)
              if (freshProduct) {
                // Adjust quantity if it exceeds available stock
                const updatedQuantity = Math.min(item.quantity, freshProduct.stock_quantity)
                return {
                  product: freshProduct,
                  quantity: updatedQuantity,
                }
              }
              return item
            } catch (error) {
              console.error(`Failed to sync product ${item.product.id}:`, error)
              return item
            }
          }),
        )

        // Update cart with fresh data
        setItems(updatedItems.filter((item) => item.quantity > 0))
      }

      syncCartProducts()
    }
  }, [isOffline, syncOnline])

  return (
    <CartContext.Provider
      value={{
        items,
        wholesalerId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isCartOpen,
        setIsCartOpen,
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
