"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-client"
import { AlertCircle } from "lucide-react"

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["admin", "retailer", "wholesaler", "delivery"]),
  business_name: z.string().optional(),
  status: z.enum(["pending", "approved", "blocked"]),
})

type FormValues = z.infer<typeof formSchema>

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "retailer",
      business_name: "",
      status: "pending",
    },
  })

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.from("users").select("*").eq("id", params.id).single()

      if (error) {
        toast({
          title: "Error fetching user",
          description: "Failed to retrieve user data.",
          variant: "destructive",
        })
        console.error("Supabase error:", error)
        return
      }

      if (data) {
        setUser(data)
        // Set default form values
        form.reset({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          business_name: data.business_name || "",
          status: data.status,
        })
      }
      setIsLoading(false)
    }

    fetchUser()
  }, [params.id, form])

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    const supabase = createClient()
    const { data, error } = await supabase.from("users").update(values).eq("id", params.id).select()

    if (error) {
      toast({
        title: "Error updating user",
        description: "Failed to update user data.",
        variant: "destructive",
      })
      console.error("Supabase error:", error)
      return
    }

    toast({
      title: "Success",
      description: "User updated successfully.",
    })
    router.push("/admin/users")
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Could not find user.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertCircle className="h-4 w-4 mr-2" />
          User not found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
        <CardDescription>Update user information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123-456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.getValues("role") === "retailer" || form.getValues("role") === "wholesaler" ? (
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Business Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter>
              <Button type="submit">Update User</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
