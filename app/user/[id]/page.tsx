"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getUserById } from "@/lib/user-service"
import { UserProfileCard } from "@/app/components/user-profile"
import Navbar from "@/app/components/navbar"
import { TranslationProvider } from "@/app/components/translation-provider"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import type { User } from "@/lib/types"

export default function UserProfilePage() {
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      if (!id) return

      setIsLoading(true)
      try {
        const { data, error } = await getUserById(id as string)
        if (error) {
          throw new Error("Failed to fetch user")
        }
        setUser(data)
      } catch (err) {
        console.error("Error fetching user:", err)
        setError("Failed to load user profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [id])

  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <div className="container mx-auto max-w-3xl">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <div className="flex flex-col items-center">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-8 w-48 mt-4" />
                  <Skeleton className="h-6 w-24 mt-2" />
                </div>
                <div className="space-y-2 mt-6">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600">{error}</p>
                <Button asChild className="mt-4">
                  <Link href="/">Go Back Home</Link>
                </Button>
              </div>
            ) : user ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold">User Profile</h1>
                  <Button asChild variant="outline">
                    <Link href={`/chat?user=${user.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                </div>
                <UserProfileCard user={user} />
              </div>
            ) : (
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-600 mb-2">User Not Found</h2>
                <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
                <Button asChild className="mt-4">
                  <Link href="/">Go Back Home</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </TranslationProvider>
  )
}
