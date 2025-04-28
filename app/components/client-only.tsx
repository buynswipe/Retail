"use client"
import { useEffect, useState } from "react"
import type React from "react"

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <div className="min-h-screen bg-gray-50"></div>
  }

  return <>{children}</>
}
