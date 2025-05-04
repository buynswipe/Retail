// User Types
export interface User {
  id: string
  phone_number: string
  email?: string
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
  updated_at?: string
  profile_image_url?: string
  status?: "online" | "away" | "offline"
}

export type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

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
  created_at?: string
  updated_at?: string
}

export interface ProductInventory {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  manufacturing_date?: string
  expiry_date?: string
  purchase_price?: number
  created_at: string
}

// Order Types
export interface Order {
  id: string
  order_number: string
  retailer_id: string
  wholesaler_id: string
  total_amount: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  commission: number
  commission_gst: number
  delivery_charge: number
  delivery_charge_gst: number
  wholesaler_payout: number
  created_at: string
  updated_at?: string
  retailer?: User
  wholesaler?: User
  items?: OrderItem[]
}

export type OrderStatus = "placed" | "confirmed" | "rejected" | "dispatched" | "delivered" | "cancelled"
export type PaymentMethod = "cod" | "upi"
export type PaymentStatus = "pending" | "completed" | "failed"

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

// Cart Types
export interface CartItem {
  id?: string
  user_id: string
  product_id: string
  quantity: number
  product?: Product
}

// Payment Types
export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_id?: string
  reference_id: string
  upi_id?: string
  payment_date?: string
  collected_by?: string
  created_at: string
  updated_at?: string
}

// Delivery Types
export interface DeliveryAssignment {
  id: string
  order_id: string
  delivery_partner_id: string | null
  status: DeliveryStatus
  delivery_charge: number
  delivery_charge_gst: number
  otp?: string
  proof_image_url?: string
  created_at: string
  updated_at?: string
  order?: Order
  delivery_partner?: User
}

export type DeliveryStatus = "pending" | "accepted" | "declined" | "completed"

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  message_hindi?: string
  priority: NotificationPriority
  is_read: boolean
  created_at: string
}

export type NotificationType = "order" | "payment" | "chat" | "system"
export type NotificationPriority = "low" | "medium" | "high"

// Platform Settings
export interface PlatformSettings {
  id: number
  commission_percentage: number
  commission_gst_rate: number
  delivery_charge: number
  delivery_gst_rate: number
  effective_from: string
  created_by: string
  created_at?: string
}

// Analytics Types
export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface AnalyticsFilter {
  region?: string
  productCategory?: string
  paymentMethod?: string
  role?: string
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface PieChartData {
  label: string
  value: number
  color?: string
}

// Tax Report Types
export interface TaxReport {
  id: string
  user_id: string
  report_type: "monthly" | "quarterly" | "yearly"
  start_date: string
  end_date: string
  total_sales: number
  total_gst_collected: number
  total_gst_paid: number
  net_gst: number
  status: "generated" | "filed" | "paid"
  created_at: string
  updated_at?: string
}

export interface TaxReportDetail {
  id: string
  tax_report_id: string
  transaction_type: "sale" | "purchase"
  transaction_id: string
  transaction_date: string
  amount: number
  gst_rate: number
  gst_amount: number
  hsn_code?: string
}

// Offline Types
export interface PendingOperation {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body?: any
  timestamp: number
  type: string
  entityId?: string
}

export interface OfflineData {
  key: string
  data: any
  timestamp: number
}

// Add PaymentStatus type if not already defined
export type PaymentStatusType = "pending" | "completed" | "failed" | "refunded" | "cancelled"

// Add PaymentGateway type if not already defined
export type PaymentGateway = "payu" | "paytm" | "phonepe" | "razorpay" | "cod"

// Add PaymentMethod type if not already defined
export type PaymentMethodType = "card" | "netbanking" | "upi" | "wallet" | "emi" | "cod"

// Add PaymentDetails interface if not already defined
export interface PaymentDetails {
  gateway: PaymentGateway
  method?: PaymentMethodType
  transaction_id?: string
  amount: number
  status: string
  error_message?: string
  raw_response?: any
}

// Add Order interface if not already defined

export interface OrderItem {
  product_id: string
  quantity: number
  price: number
  name: string
  variant?: string
}

// Add OrderStatus type if not already defined
export type OrderStatusType = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
