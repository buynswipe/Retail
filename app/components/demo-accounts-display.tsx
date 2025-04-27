"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    phone: "1234567890",
    email: "admin@retailbandhu.com",
    otp: "123456",
  },
  {
    role: "Retailer",
    phone: "9876543210",
    email: "retailer@retailbandhu.com",
    otp: "123456",
  },
  {
    role: "Wholesaler",
    phone: "9876543211",
    email: "wholesaler@retailbandhu.com",
    otp: "123456",
  },
  {
    role: "Delivery",
    phone: "9876543212",
    email: "delivery@retailbandhu.com",
    otp: "123456",
  },
]

interface DemoAccountsDisplayProps {
  onSelectPhone?: (phone: string) => void
  onSelectEmail?: (email: string) => void
  onSelectOtp?: (otp: string) => void
}

export function DemoAccountsDisplay({ onSelectPhone, onSelectEmail, onSelectOtp }: DemoAccountsDisplayProps) {
  const [activeTab, setActiveTab] = useState("phone")

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-center text-lg">Demo Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="mt-4">
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <div key={account.phone} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{account.role}</div>
                    <div className="text-sm text-muted-foreground">{account.phone}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectPhone?.(account.phone)
                      onSelectOtp?.(account.otp)
                    }}
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <div key={account.email} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{account.role}</div>
                    <div className="text-sm text-muted-foreground">{account.email}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectEmail?.(account.email)
                      onSelectOtp?.(account.otp)
                    }}
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            For demo accounts, use OTP: <strong>123456</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
