"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { toast } from "@/components/ui/use-toast"

interface ProfileFormProps {
  onUpdate: () => void
}

export default function ProfileForm({ onUpdate }: ProfileFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    business_name: "",
    phone_number: "",
    pin_code: "",
    gst_number: "",
    bank_account_number: "",
    bank_ifsc: "",
    vehicle_type: "",
  })

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setUserData({
          name: data.name || "",
          business_name: data.business_name || "",
          phone_number: data.phone_number || "",
          pin_code: data.pin_code || "",
          gst_number: data.gst_number || "",
          bank_account_number: data.bank_account_number || "",
          bank_ifsc: data.bank_ifsc || "",
          vehicle_type: data.vehicle_type || "",
        })
      }
      setLoading(false)
    }

    fetchUserData()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from("users")
      .update({
        name: userData.name,
        business_name: userData.business_name,
        pin_code: userData.pin_code,
        gst_number: userData.gst_number,
        bank_account_number: userData.bank_account_number,
        bank_ifsc: userData.bank_ifsc,
        vehicle_type: userData.vehicle_type,
      })
      .eq("id", user?.id)

    setLoading(false)

    if (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
      onUpdate()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal and business information here.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={userData.name} onChange={handleChange} placeholder="Your full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={userData.phone_number}
                disabled
                placeholder="Your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={userData.business_name}
                onChange={handleChange}
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin_code">PIN Code</Label>
              <Input
                id="pin_code"
                name="pin_code"
                value={userData.pin_code}
                onChange={handleChange}
                placeholder="Your PIN code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={userData.gst_number}
                onChange={handleChange}
                placeholder="Your GST number"
              />
            </div>

            {user.role === "delivery" && (
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Input
                  id="vehicle_type"
                  name="vehicle_type"
                  value={userData.vehicle_type}
                  onChange={handleChange}
                  placeholder="Bike or Van"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Banking Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  name="bank_account_number"
                  value={userData.bank_account_number}
                  onChange={handleChange}
                  placeholder="Your bank account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_ifsc">IFSC Code</Label>
                <Input
                  id="bank_ifsc"
                  name="bank_ifsc"
                  value={userData.bank_ifsc}
                  onChange={handleChange}
                  placeholder="Your bank IFSC code"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
