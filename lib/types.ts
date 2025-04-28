// Product Types
export interface Product {
  id: string
  wholesaler_id: string
  name: string
  description?: string
  price: number
  stock_quantity: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  sku: string
  unit: string
  category?: string
  wholesaler?: User
}

// Inventory Types
export interface InventoryItem {
  product: Product
  quantity: number
  lowStockThreshold: number
  batchCount: number
}

export interface ProductBatch {
  id: string
  batchNumber: string
  quantity: number
  manufacturingDate?: string
  expiryDate?: string
  notes?: string
}

export interface InventoryTransaction {
  id: string
  type: "increase" | "decrease"
  quantity: number
  reason: string
  notes?: string
  createdAt: string
  userName: string
}

// Cart Types
export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  wholesalerId: string | null
  total: number
}

// Order Types
export interface Order {
  id: string
  retailer_id: string
  wholesaler_id: string
  status: string
  total_amount: number
  payment_status: string
  delivery_address: string
  delivery_contact: string
  notes?: string
  expected_delivery_date?: string
  created_at: string
  updated_at: string
  status_history?: OrderStatusHistoryItem[]
  items?: any[]
  retailer?: any
  wholesaler?: any
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_paid"

// User Types
export interface User {
  id: string
  email: string
  role: "admin" | "retailer" | "wholesaler" | "delivery"
  name: string
  business_name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  profile_image?: string
  created_at: string
  updated_at: string
}

export interface OrderStatusHistoryItem {
  status: string
  timestamp: string
  updated_by: string
  role: string
  reason?: string | null
}
