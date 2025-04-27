"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("count", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (!error && data) {
        setUnreadCount(data.length)
      }
    }

    fetchUnreadCount()

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUnreadCount((prev) => prev + 1)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          } else if (!payload.new.is_read && payload.old.is_read) {
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
            variant="destructive"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
