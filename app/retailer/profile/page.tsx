"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RetailerProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.push("/profile")
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
}
