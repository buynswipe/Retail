"use client"

import ClientOnly from "@/app/components/client-only"
import ProfileContent from "./profile-content"

// Prevent static generation
export const dynamic = "force-dynamic"

export default function ProfilePage() {
  return (
    <ClientOnly>
      <ProfileContent />
    </ClientOnly>
  )
}
