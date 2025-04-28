import type { Product, Order, OrderItem, User, Payment, DeliveryAssignment, Notification } from "./types"

// Demo users data
export const demoUsers: User[] = [
  {
    id: "admin-1",
    phone_number: "1234567890",
    role: "admin",
    name: "Admin User",
    pin_code: "400001",
    is_approved: true,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "retailer-1",
    phone_number: "9876543210",
    role: "retailer",
    name: "Raj Kumar",
    business_name: "Raj Grocery Store",
    pin_code: "400001",
    is_approved: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "retailer-2",
    phone_number: "9876543213",
    role: "retailer",
    name: "Priya Sharma",
    business_name: "Priya General Store",
    pin_code: "400002",
    is_approved: true,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wholesaler-1",
    phone_number: "9876543211",
    role: "wholesaler",
    name: "Vikram Singh",
    business_name: "Vikram Wholesale",
    pin_code: "400002",
    gst_number: "27AADCB2230M1ZT",
    bank_account_number: "12345678901",
    bank_ifsc: "SBIN0001234",
    is_approved: true,
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wholesaler-2",
    phone_number: "9876543214",
    role: "wholesaler",
    name: "Amit Patel",
    business_name: "Patel Distributors",
    pin_code: "400003",
    gst_number: "27AADCB2230M2ZS",
    bank_account_number: "98765432101",
    bank_ifsc: "HDFC0000123",
    is_approved: true,
    created_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "delivery-1",
    phone_number: "9876543212",
    role: "delivery",
    name: "Suresh Patel",
    pin_code: "400003",
    vehicle_type: "bike",
    bank_account_number: "09876543210",
    bank_ifsc: "HDFC0000123",
    is_approved: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "delivery-2",
    phone_number: "9876543215",
    role: "delivery",
    name: "Rahul Verma",
    pin_code: "400001",
    vehicle_type: "van",
    bank_account_number: "56789012345",
    bank_ifsc: "ICIC0001234",
    is_approved: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Demo product categories
export const productCategories = [
  "Groceries",
  "Dairy",
  "Beverages",
  "Snacks",
  "Personal Care",
  "Household",
  "Stationery",
  "Confectionery",
]

// Demo products data
export const generateDemoProducts = (): Product[] => {
  const products: Product[] = [
    // Wholesaler 1 Products
    {
      id: "product-1",
      wholesaler_id: "wholesaler-1",
      name: "Tata Salt",
      description: "Iodized salt for cooking, 1kg packet",
      price: 20,
      stock_quantity: 500,
      image_url: "/everyday-cooking-essentials.png",
      is_active: true,
      category: "Groceries",
      hsn_code: "25010020",
      gst_rate: 5,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-2",
      wholesaler_id: "wholesaler-1",
      name: "Aashirvaad Atta",
      description: "Whole wheat flour, 10kg bag",
      price: 350,
      stock_quantity: 200,
      image_url: "/golden-wheat-flour.png",
      is_active: true,
      category: "Groceries",
      hsn_code: "11010000",
      gst_rate: 5,
      created_at: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-3",
      wholesaler_id: "wholesaler-1",
      name: "Amul Butter",
      description: "Pasteurized butter, 500g pack",
      price: 245,
      stock_quantity: 150,
      image_url: "/golden-butter-dish.png",
      is_active: true,
      category: "Dairy",
      hsn_code: "04051000",
      gst_rate: 12,
      created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-4",
      wholesaler_id: "wholesaler-1",
      name: "Parle-G Biscuits",
      description: "Original glucose biscuits, box of 24 packets",
      price: 120,
      stock_quantity: 300,
      image_url: "/golden-stack-biscuits.png",
      is_active: true,
      category: "Snacks",
      hsn_code: "19053100",
      gst_rate: 18,
      created_at: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-5",
      wholesaler_id: "wholesaler-1",
      name: "Maggi Noodles",
      description: "2-minute noodles, carton of 48 packets",
      price: 960,
      stock_quantity: 100,
      image_url: "/steaming-noodle-bowl.png",
      is_active: true,
      category: "Snacks",
      hsn_code: "19023010",
      gst_rate: 18,
      created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-6",
      wholesaler_id: "wholesaler-1",
      name: "Surf Excel Detergent",
      description: "Washing powder, 5kg box",
      price: 550,
      stock_quantity: 80,
      image_url: "/sparkling-laundry.png",
      is_active: true,
      category: "Household",
      hsn_code: "34022010",
      gst_rate: 18,
      created_at: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-7",
      wholesaler_id: "wholesaler-1",
      name: "Colgate Toothpaste",
      description: "Strong teeth toothpaste, pack of 12 tubes (100g each)",
      price: 720,
      stock_quantity: 120,
      image_url: "/placeholder.svg?height=200&width=200&query=Toothpaste",
      is_active: true,
      category: "Personal Care",
      hsn_code: "33061020",
      gst_rate: 18,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-8",
      wholesaler_id: "wholesaler-1",
      name: "Dettol Soap",
      description: "Antiseptic soap, carton of 48 bars (75g each)",
      price: 1200,
      stock_quantity: 90,
      image_url: "/placeholder.svg?height=200&width=200&query=Soap",
      is_active: true,
      category: "Personal Care",
      hsn_code: "34011190",
      gst_rate: 18,
      created_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Wholesaler 2 Products
    {
      id: "product-9",
      wholesaler_id: "wholesaler-2",
      name: "Amul Gold Milk",
      description: "Full cream milk, carton of 12 tetra packs (1L each)",
      price: 720,
      stock_quantity: 150,
      image_url: "/placeholder.svg?height=200&width=200&query=Milk",
      is_active: true,
      category: "Dairy",
      hsn_code: "04012000",
      gst_rate: 5,
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-10",
      wholesaler_id: "wholesaler-2",
      name: "Britannia Good Day",
      description: "Butter cookies, box of 24 packets",
      price: 240,
      stock_quantity: 200,
      image_url: "/placeholder.svg?height=200&width=200&query=Cookies",
      is_active: true,
      category: "Snacks",
      hsn_code: "19053100",
      gst_rate: 18,
      created_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-11",
      wholesaler_id: "wholesaler-2",
      name: "Tata Tea Premium",
      description: "Tea leaves, carton of 24 packets (250g each)",
      price: 1800,
      stock_quantity: 80,
      image_url: "/placeholder.svg?height=200&width=200&query=Tea",
      is_active: true,
      category: "Beverages",
      hsn_code: "09023010",
      gst_rate: 5,
      created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-12",
      wholesaler_id: "wholesaler-2",
      name: "Nescafe Classic",
      description: "Instant coffee, carton of 12 jars (100g each)",
      price: 2400,
      stock_quantity: 60,
      image_url: "/placeholder.svg?height=200&width=200&query=Coffee",
      is_active: true,
      category: "Beverages",
      hsn_code: "21011110",
      gst_rate: 18,
      created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-13",
      wholesaler_id: "wholesaler-2",
      name: "Classmate Notebooks",
      description: "Single line notebooks, box of 100 (80 pages each)",
      price: 1500,
      stock_quantity: 50,
      image_url: "/placeholder.svg?height=200&width=200&query=Notebooks",
      is_active: true,
      category: "Stationery",
      hsn_code: "48202000",
      gst_rate: 12,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-14",
      wholesaler_id: "wholesaler-2",
      name: "Lizol Floor Cleaner",
      description: "Disinfectant floor cleaner, carton of 12 bottles (1L each)",
      price: 1800,
      stock_quantity: 70,
      image_url: "/placeholder.svg?height=200&width=200&query=Floor Cleaner",
      is_active: true,
      category: "Household",
      hsn_code: "34022090",
      gst_rate: 18,
      created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-15",
      wholesaler_id: "wholesaler-2",
      name: "Dairy Milk Chocolate",
      description: "Milk chocolate, box of 48 bars (40g each)",
      price: 1200,
      stock_quantity: 100,
      image_url: "/placeholder.svg?height=200&width=200&query=Chocolate",
      is_active: true,
      category: "Confectionery",
      hsn_code: "18069000",
      gst_rate: 28,
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "product-16",
      wholesaler_id: "wholesaler-2",
      name: "Clinic Plus Shampoo",
      description: "Strengthening shampoo, carton of 24 bottles (200ml each)",
      price: 1440,
      stock_quantity: 85,
      image_url: "/placeholder.svg?height=200&width=200&query=Shampoo",
      is_active: true,
      category: "Personal Care",
      hsn_code: "33051010",
      gst_rate: 18,
      created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  return products
}

// Generate demo orders
export const generateDemoOrders = (products: Product[]): Order[] => {
  // Helper function to generate order number
  const generateOrderNumber = (index: number): string => {
    return `ORD${String(Date.now()).substring(7)}${index.toString().padStart(3, "0")}`
  }

  // Helper function to calculate order totals
  const calculateOrderTotals = (items: OrderItem[]): { total: number; commission: number; commissionGst: number } => {
    const total = items.reduce((sum, item) => sum + item.total_price, 0)
    const commission = total * 0.02 // 2% commission
    const commissionGst = commission * 0.18 // 18% GST on commission
    return { total, commission, commissionGst }
  }

  const orders: Order[] = []

  // Generate orders for retailer-1
  const retailer1Orders: Order[] = [
    {
      id: "order-1",
      order_number: generateOrderNumber(1),
      retailer_id: "retailer-1",
      wholesaler_id: "wholesaler-1",
      total_amount: 0, // Will be calculated
      status: "delivered",
      payment_method: "upi",
      payment_status: "completed",
      commission: 0, // Will be calculated
      commission_gst: 0, // Will be calculated
      delivery_charge: 50,
      delivery_charge_gst: 9, // 18% GST on delivery
      wholesaler_payout: 0, // Will be calculated
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item-1",
          order_id: "order-1",
          product_id: "product-1",
          quantity: 10,
          unit_price: 20,
          total_price: 200,
          product: products.find((p) => p.id === "product-1"),
        },
        {
          id: "item-2",
          order_id: "order-1",
          product_id: "product-3",
          quantity: 5,
          unit_price: 245,
          total_price: 1225,
          product: products.find((p) => p.id === "product-3"),
        },
        {
          id: "item-3",
          order_id: "order-1",
          product_id: "product-4",
          quantity: 2,
          unit_price: 120,
          total_price: 240,
          product: products.find((p) => p.id === "product-4"),
        },
      ],
    },
    {
      id: "order-2",
      order_number: generateOrderNumber(2),
      retailer_id: "retailer-1",
      wholesaler_id: "wholesaler-2",
      total_amount: 0, // Will be calculated
      status: "delivered",
      payment_method: "cod",
      payment_status: "completed",
      commission: 0, // Will be calculated
      commission_gst: 0, // Will be calculated
      delivery_charge: 50,
      delivery_charge_gst: 9, // 18% GST on delivery
      wholesaler_payout: 0, // Will be calculated
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item-4",
          order_id: "order-2",
          product_id: "product-9",
          quantity: 3,
          unit_price: 720,
          total_price: 2160,
          product: products.find((p) => p.id === "product-9"),
        },
        {
          id: "item-5",
          order_id: "order-2",
          product_id: "product-10",
          quantity: 4,
          unit_price: 240,
          total_price: 960,
          product: products.find((p) => p.id === "product-10"),
        },
      ],
    },
    {
      id: "order-3",
      order_number: generateOrderNumber(3),
      retailer_id: "retailer-1",
      wholesaler_id: "wholesaler-1",
      total_amount: 0, // Will be calculated
      status: "dispatched",
      payment_method: "upi",
      payment_status: "completed",
      commission: 0, // Will be calculated
      commission_gst: 0, // Will be calculated
      delivery_charge: 50,
      delivery_charge_gst: 9, // 18% GST on delivery
      wholesaler_payout: 0, // Will be calculated
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item-6",
          order_id: "order-3",
          product_id: "product-6",
          quantity: 3,
          unit_price: 550,
          total_price: 1650,
          product: products.find((p) => p.id === "product-6"),
        },
        {
          id: "item-7",
          order_id: "order-3",
          product_id: "product-7",
          quantity: 2,
          unit_price: 720,
          total_price: 1440,
          product: products.find((p) => p.id === "product-7"),
        },
      ],
    },
  ]

  // Generate orders for retailer-2
  const retailer2Orders: Order[] = [
    {
      id: "order-4",
      order_number: generateOrderNumber(4),
      retailer_id: "retailer-2",
      wholesaler_id: "wholesaler-2",
      total_amount: 0, // Will be calculated
      status: "delivered",
      payment_method: "upi",
      payment_status: "completed",
      commission: 0, // Will be calculated
      commission_gst: 0, // Will be calculated
      delivery_charge: 50,
      delivery_charge_gst: 9, // 18% GST on delivery
      wholesaler_payout: 0, // Will be calculated
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item-8",
          order_id: "order-4",
          product_id: "product-11",
          quantity: 2,
          unit_price: 1800,
          total_price: 3600,
          product: products.find((p) => p.id === "product-11"),
        },
        {
          id: "item-9",
          order_id: "order-4",
          product_id: "product-13",
          quantity: 1,
          unit_price: 1500,
          total_price: 1500,
          product: products.find((p) => p.id === "product-13"),
        },
      ],
    },
    {
      id: "order-5",
      order_number: generateOrderNumber(5),
      retailer_id: "retailer-2",
      wholesaler_id: "wholesaler-1",
      total_amount: 0, // Will be calculated
      status: "confirmed",
      payment_method: "cod",
      payment_status: "pending",
      commission: 0, // Will be calculated
      commission_gst: 0, // Will be calculated
      delivery_charge: 50,
      delivery_charge_gst: 9, // 18% GST on delivery
      wholesaler_payout: 0, // Will be calculated
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item-10",
          order_id: "order-5",
          product_id: "product-2",
          quantity: 5,
          unit_price: 350,
          total_price: 1750,
          product: products.find((p) => p.id === "product-2"),
        },
        {
          id: "item-11",
          order_id: "order-5",
          product_id: "product-5",
          quantity: 2,
          unit_price: 960,
          total_price: 1920,
          product: products.find((p) => p.id === "product-5"),
        },
        {
          id: "item-12",
          order_id: "order-5",
          product_id: "product-8",
          quantity: 1,
          unit_price: 1200,
          total_price: 1200,
          product: products.find((p) => p.id === "product-8"),
        },
      ],
    },
  ]

  // Generate a new order for retailer-1
  const newOrder: Order = {
    id: "order-6",
    order_number: generateOrderNumber(6),
    retailer_id: "retailer-1",
    wholesaler_id: "wholesaler-2",
    total_amount: 0, // Will be calculated
    status: "placed",
    payment_method: "upi",
    payment_status: "pending",
    commission: 0, // Will be calculated
    commission_gst: 0, // Will be calculated
    delivery_charge: 50,
    delivery_charge_gst: 9, // 18% GST on delivery
    wholesaler_payout: 0, // Will be calculated
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    items: [
      {
        id: "item-13",
        order_id: "order-6",
        product_id: "product-12",
        quantity: 1,
        unit_price: 2400,
        total_price: 2400,
        product: products.find((p) => p.id === "product-12"),
      },
      {
        id: "item-14",
        order_id: "order-6",
        product_id: "product-15",
        quantity: 2,
        unit_price: 1200,
        total_price: 2400,
        product: products.find((p) => p.id === "product-15"),
      },
    ],
  }

  // Combine all orders
  const allOrders = [...retailer1Orders, ...retailer2Orders, newOrder]

  // Calculate totals for each order
  allOrders.forEach((order) => {
    if (order.items) {
      const { total, commission, commissionGst } = calculateOrderTotals(order.items)
      order.total_amount = total
      order.commission = commission
      order.commission_gst = commissionGst
      order.wholesaler_payout = total - commission - commissionGst - order.delivery_charge - order.delivery_charge_gst
    }
  })

  return allOrders
}

// Generate demo payments
export const generateDemoPayments = (orders: Order[]): Payment[] => {
  const payments: Payment[] = []

  orders.forEach((order, index) => {
    if (order.payment_status === "completed") {
      payments.push({
        id: `payment-${index + 1}`,
        order_id: order.id,
        amount: order.total_amount,
        payment_method: order.payment_method,
        payment_status: "completed",
        transaction_id: order.payment_method === "upi" ? `UPI${Date.now()}${index}` : undefined,
        reference_id: `REF${Date.now()}${index}`,
        upi_id: order.payment_method === "upi" ? "retailer@okaxis" : undefined,
        payment_date: order.created_at,
        collected_by: order.payment_method === "cod" ? "delivery-1" : undefined,
        created_at: order.created_at,
      })
    }
  })

  return payments
}

// Generate demo delivery assignments
export const generateDemoDeliveryAssignments = (orders: Order[]): DeliveryAssignment[] => {
  const assignments: DeliveryAssignment[] = []

  orders.forEach((order, index) => {
    const status =
      order.status === "placed" || order.status === "confirmed"
        ? "pending"
        : order.status === "dispatched"
          ? "accepted"
          : order.status === "delivered"
            ? "completed"
            : "pending"

    const deliveryPartnerId =
      status === "accepted" || status === "completed" ? (index % 2 === 0 ? "delivery-1" : "delivery-2") : null

    assignments.push({
      id: `delivery-${index + 1}`,
      order_id: order.id,
      delivery_partner_id: deliveryPartnerId,
      status,
      delivery_charge: order.delivery_charge,
      delivery_charge_gst: order.delivery_charge_gst,
      otp: status === "accepted" ? "123456" : undefined,
      proof_image_url:
        status === "completed" ? "/placeholder.svg?height=200&width=200&query=Delivery Proof" : undefined,
      created_at: order.created_at,
      order,
    })
  })

  return assignments
}

// Generate demo notifications
export const generateDemoNotifications = (users: User[], orders: Order[]): Notification[] => {
  const notifications: Notification[] = []
  let notificationId = 1

  // Order notifications
  orders.forEach((order) => {
    // Notification for retailer
    notifications.push({
      id: `notification-${notificationId++}`,
      user_id: order.retailer_id,
      type: "order",
      message: `Your order #${order.order_number} has been ${order.status}.`,
      message_hindi: `आपका ऑर्डर #${order.order_number} ${
        order.status === "placed"
          ? "प्लेस किया गया है"
          : order.status === "confirmed"
            ? "कन्फर्म किया गया है"
            : order.status === "dispatched"
              ? "भेज दिया गया है"
              : order.status === "delivered"
                ? "डिलीवर किया गया है"
                : "अपडेट किया गया है"
      }.`,
      priority: "medium",
      is_read: Math.random() > 0.5,
      created_at: order.created_at,
    })

    // Notification for wholesaler
    notifications.push({
      id: `notification-${notificationId++}`,
      user_id: order.wholesaler_id,
      type: "order",
      message: `New order #${order.order_number} received from retailer.`,
      message_hindi: `रिटेलर से नया ऑर्डर #${order.order_number} प्राप्त हुआ है।`,
      priority: "high",
      is_read: Math.random() > 0.7,
      created_at: order.created_at,
    })

    // Notification for delivery partner if assigned
    if (order.status === "dispatched" || order.status === "delivered") {
      notifications.push({
        id: `notification-${notificationId++}`,
        user_id: order.status === "dispatched" ? "delivery-1" : "delivery-2",
        type: "order",
        message: `New delivery assignment for order #${order.order_number}.`,
        message_hindi: `ऑर्डर #${order.order_number} के लिए नया डिलीवरी असाइनमेंट।`,
        priority: "high",
        is_read: order.status === "delivered",
        created_at: order.created_at,
      })
    }
  })

  // Payment notifications
  orders.forEach((order) => {
    if (order.payment_status === "completed") {
      // Notification for retailer
      notifications.push({
        id: `notification-${notificationId++}`,
        user_id: order.retailer_id,
        type: "payment",
        message: `Payment for order #${order.order_number} has been completed.`,
        message_hindi: `ऑर्डर #${order.order_number} के लिए भुगतान पूरा हो गया है।`,
        priority: "medium",
        is_read: Math.random() > 0.5,
        created_at: order.created_at,
      })

      // Notification for wholesaler
      notifications.push({
        id: `notification-${notificationId++}`,
        user_id: order.wholesaler_id,
        type: "payment",
        message: `Payment received for order #${order.order_number}.`,
        message_hindi: `ऑर्डर #${order.order_number} के लिए भुगतान प्राप्त हुआ है।`,
        priority: "medium",
        is_read: Math.random() > 0.6,
        created_at: order.created_at,
      })
    }
  })

  // System notifications
  users.forEach((user) => {
    notifications.push({
      id: `notification-${notificationId++}`,
      user_id: user.id,
      type: "system",
      message: "Welcome to RetailBandhu! Complete your profile for a better experience.",
      message_hindi: "रिटेलबंधु में आपका स्वागत है! बेहतर अनुभव के लिए अपनी प्रोफ़ाइल पूरी करें।",
      priority: "low",
      is_read: Math.random() > 0.3,
      created_at: user.created_at,
    })
  })

  return notifications
}

// Memory-based storage for demo data (for v0 preview environment)
let memoryStore = {
  users: [] as User[],
  products: [] as Product[],
  orders: [] as Order[],
  payments: [] as Payment[],
  deliveryAssignments: [] as DeliveryAssignment[],
  notifications: [] as Notification[],
  initialized: false,
}

// Initialize demo data in memory or IndexedDB based on environment
export const initializeDemoData = async (): Promise<void> => {
  try {
    console.log("Initializing demo data...")

    // Check if we're in the v0 preview environment
    const isV0Preview = typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")

    // Generate all demo data
    const products = generateDemoProducts()
    const orders = generateDemoOrders(products)
    const payments = generateDemoPayments(orders)
    const deliveryAssignments = generateDemoDeliveryAssignments(orders)
    const notifications = generateDemoNotifications(demoUsers, orders)

    if (isV0Preview) {
      // Store in memory for v0 preview environment
      memoryStore = {
        users: demoUsers,
        products,
        orders,
        payments,
        deliveryAssignments,
        notifications,
        initialized: true,
      }
      console.log("Demo data initialized in memory for v0 preview environment")
    } else {
      // Store in IndexedDB for production environment
      try {
        const db = await openDatabase()

        // Clear existing data
        await clearObjectStore(db, "users")
        await clearObjectStore(db, "products")
        await clearObjectStore(db, "orders")
        await clearObjectStore(db, "payments")
        await clearObjectStore(db, "deliveryAssignments")
        await clearObjectStore(db, "notifications")

        // Add demo data
        await addBulkData(db, "users", demoUsers)
        await addBulkData(db, "products", products)
        await addBulkData(db, "orders", orders)
        await addBulkData(db, "payments", payments)
        await addBulkData(db, "deliveryAssignments", deliveryAssignments)
        await addBulkData(db, "notifications", notifications)

        console.log("Demo data initialized in IndexedDB successfully!")
      } catch (error) {
        console.error("Error initializing IndexedDB, falling back to memory storage:", error)
        // Fallback to memory storage
        memoryStore = {
          users: demoUsers,
          products,
          orders,
          payments,
          deliveryAssignments,
          notifications,
          initialized: true,
        }
      }
    }
  } catch (error) {
    console.error("Error initializing demo data:", error)
  }
}

// Helper functions for IndexedDB operations
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available in this environment"))
      return
    }

    const request = indexedDB.open("RetailBandhuDB", 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("orders")) {
        db.createObjectStore("orders", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("payments")) {
        db.createObjectStore("payments", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("deliveryAssignments")) {
        db.createObjectStore("deliveryAssignments", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("notifications")) {
        db.createObjectStore("notifications", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

const clearObjectStore = (db: IDBDatabase, storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const addBulkData = (db: IDBDatabase, storeName: string, data: any[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    let completed = 0

    data.forEach((item) => {
      const request = store.add(item)

      request.onsuccess = () => {
        completed++
        if (completed === data.length) {
          resolve()
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })

    // If data array is empty, resolve immediately
    if (data.length === 0) {
      resolve()
    }
  })
}

// Export memory store for direct access in v0 preview
export const getDemoData = () => {
  return memoryStore
}

// Export demo data initialization function
export default initializeDemoData
