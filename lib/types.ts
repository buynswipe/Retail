// Payment types
export type PaymentMethod = "razorpay" | "paytm" | "phonepe" | "payu" | "cod" | "upi"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface Payment {
  id: string
  order_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  payment_details?: Record<string, any>
  created_at: string
  updated_at?: string
}

// Order types
export type OrderStatus = "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  retailer_id: string
  wholesaler_id: string
  total_amount: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: "pending" | "paid" | "failed"
  commission: number
  commission_gst: number
  delivery_charge: number
  delivery_charge_gst: number
  wholesaler_payout: number
  created_at: string
  updated_at?: string
  items?: OrderItem[]
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  mrp: number
  category_id: string
  wholesaler_id: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  stock_quantity: number
  hsn_code?: string
  gst_rate: number
  created_at: string
  updated_at?: string
}

// User types
export type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

export interface User {
  id: string
  phone_number: string
  role: UserRole
  name?: string
  business_name?: string
  pin_code?: string
  gst_number?: string
  bank_account_number?: string
  bank_ifsc?: string
  vehicle_type?: "bike" | "van"
  is_approved: boolean
  created_at: string
}

// Inventory types
export interface InventoryItem {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  manufacturing_date?: string
  expiry_date?: string
  purchase_price: number
  created_at: string
  updated_at?: string
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  reference_id?: string
  is_read?: boolean
  message_hindi?: string
  priority: "low" | "medium" | "high"
  created_at: string
}

// Tax types
export interface TaxReport {
  id: string
  user_id: string
  report_type: "monthly" | "quarterly" | "yearly" | "custom"
  start_date: string
  end_date: string
  total_sales: number
  total_tax_collected: number
  total_tax_paid: number
  net_tax_liability: number
  status: "generated" | "downloaded" | "submitted"
  created_at: string
  updated_at: string
}
