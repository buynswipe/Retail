"use client"
import ClientOnly from "@/app/components/client-only"
import BrowseContent from "./browse-content"

// Add dynamic export to prevent static generation
export const dynamic = "force-dynamic"

export default function BrowsePage() {
  return (
    <ClientOnly>
      <BrowseContent />
    </ClientOnly>
  )
}
