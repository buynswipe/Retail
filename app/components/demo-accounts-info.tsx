"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DemoAccountProps {
  onSelectAccount: (phone: string) => void
}

export function DemoAccountsInfo({ onSelectAccount }: DemoAccountProps) {
  const [expanded, setExpanded] = useState(false)

  const demoAccounts = [
    { role: "Admin", phone: "1234567890" },
    { role: "Retailer", phone: "9876543210" },
    { role: "Wholesaler", phone: "9876543211" },
    { role: "Delivery", phone: "9876543212" },
  ]

  if (!expanded) {
    return (
      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => setExpanded(true)}>
          Show Demo Accounts
        </Button>
      </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-center text-lg">Demo Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-center mb-4">Click on an account to auto-fill. Use any 6 digits as OTP.</div>
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <Button
              key={account.phone}
              variant="outline"
              className="text-sm justify-start"
              onClick={() => onSelectAccount(account.phone)}
            >
              <div>
                <div className="font-medium">{account.role}</div>
                <div className="text-xs opacity-70">{account.phone}</div>
              </div>
            </Button>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Hide Demo Accounts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
