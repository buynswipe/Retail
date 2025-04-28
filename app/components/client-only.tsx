"use client"

import { useEffect, useState, type ReactNode } from "react"
import SSRFallback from "./ssr-fallback"

export default function ClientOnly({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <SSRFallback />
  }

  return <>{children}</>
}
