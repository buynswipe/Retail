import type { UserRole } from "./supabase"

// Define demo account structure
interface DemoAccount {
  phone: string
  email: string
  role: UserRole
  name: string
  businessName: string
  pinCode: string
  isApproved: boolean
  vehicleType?: "bike" | "van"
}

// Define demo accounts
const demoAccounts: Record<string, DemoAccount> = {
  "1234567890": {
    phone: "1234567890",
    email: "admin@retailbandhu.com",
    role: "admin",
    name: "Admin User",
    businessName: "RetailBandhu Admin",
    pinCode: "110001",
    isApproved: true,
  },
  "9876543210": {
    phone: "9876543210",
    email: "retailer@retailbandhu.com",
    role: "retailer",
    name: "Demo Retailer",
    businessName: "Demo Retail Shop",
    pinCode: "110002",
    isApproved: true,
  },
  "9876543211": {
    phone: "9876543211",
    email: "wholesaler@retailbandhu.com",
    role: "wholesaler",
    name: "Demo Wholesaler",
    businessName: "Demo Wholesale Business",
    pinCode: "110003",
    isApproved: true,
  },
  "9876543212": {
    phone: "9876543212",
    email: "delivery@retailbandhu.com",
    role: "delivery",
    name: "Demo Delivery",
    businessName: "Demo Delivery Service",
    pinCode: "110004",
    isApproved: true,
    vehicleType: "bike",
  },
}

// Check if an identifier (phone or email) belongs to a demo account
export function isDemoAccount(identifier: string): boolean {
  // Check if it's a phone number in our demo accounts
  if (demoAccounts[identifier]) {
    return true
  }

  // Check if it's an email in our demo accounts
  for (const account of Object.values(demoAccounts)) {
    if (account.email === identifier) {
      return true
    }
  }

  return false
}

// Get demo account details by identifier (phone or email)
export function getDemoAccount(identifier: string): DemoAccount | null {
  // Check if it's a phone number in our demo accounts
  if (demoAccounts[identifier]) {
    return demoAccounts[identifier]
  }

  // Check if it's an email in our demo accounts
  for (const account of Object.values(demoAccounts)) {
    if (account.email === identifier) {
      return account
    }
  }

  return null
}

// Get all demo accounts
export function getAllDemoAccounts(): DemoAccount[] {
  return Object.values(demoAccounts)
}
