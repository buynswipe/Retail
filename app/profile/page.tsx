"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationProvider, useTranslation } from "../components/translation-provider"
import Navbar from "../components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { Save, Loader2 } from "lucide-react"

function ProfileContent() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    pin_code: "",
    gst_number: "",
    bank_account_number: "",
    bank_ifsc: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        business_name: user.business_name || "",
        pin_code: user.pin_code || "",
        gst_number: user.gst_number || "",
        bank_account_number: user.bank_account_number || "",
        bank_ifsc: user.bank_ifsc || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          business_name: formData.business_name,
          pin_code: formData.pin_code,
          gst_number: formData.gst_number,
          bank_account_number: formData.bank_account_number,
          bank_ifsc: formData.bank_ifsc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update user context
      setUser({
        ...user,
        name: formData.name,
        business_name: formData.business_name,
        pin_code: formData.pin_code,
        gst_number: formData.gst_number,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
      })

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              placeholder="Enter your business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin_code">PIN Code</Label>
            <Input
              id="pin_code"
              name="pin_code"
              value={formData.pin_code}
              onChange={handleInputChange}
              placeholder="Enter your PIN code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" value={user.phone_number} disabled className="bg-gray-50" />
            <p className="text-xs text-gray-500">Phone number cannot be changed.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input
              id="gst_number"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleInputChange}
              placeholder="Enter your GST number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <Input
              id="role"
              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              disabled
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank_account_number">Bank Account Number</Label>
            <Input
              id="bank_account_number"
              name="bank_account_number"
              value={formData.bank_account_number}
              onChange={handleInputChange}
              placeholder="Enter your bank account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_ifsc">IFSC Code</Label>
            <Input
              id="bank_ifsc"
              name="bank_ifsc"
              value={formData.bank_ifsc}
              onChange={handleInputChange}
              placeholder="Enter your bank IFSC code"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Toaster />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <ProfileContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
