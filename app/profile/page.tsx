"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileForm from "@/app/components/profile-form"

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="profile" className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm onUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="p-2 bg-muted rounded-md">
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="p-2 bg-muted rounded-md">
                  {user.isApproved ? (
                    <span className="text-green-600 font-medium">Approved</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending Approval</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
