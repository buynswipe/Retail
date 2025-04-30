"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MapPin, Building, FileText, Clock } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface UserProfileProps {
  user: UserType | null
  size?: "sm" | "md" | "lg"
  showRole?: boolean
  showStatus?: boolean
  showBadge?: boolean
  className?: string
  onClick?: () => void
}

export function UserProfile({
  user,
  size = "md",
  showRole = true,
  showStatus = false,
  showBadge = false,
  className = "",
  onClick,
}: UserProfileProps) {
  const [imageError, setImageError] = useState(false)

  if (!user) {
    return null
  }

  const avatarSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }

  const nameSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "retailer":
        return "bg-green-100 text-green-800 border-green-200"
      case "wholesaler":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delivery":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getFormattedRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div
      className={`flex items-center ${className} ${onClick ? "cursor-pointer hover:bg-gray-50 rounded-md" : ""}`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className={avatarSizes[size]}>
          {!imageError && user.profile_image_url && (
            <AvatarImage
              src={user.profile_image_url || "/placeholder.svg"}
              alt={user.name || "User"}
              onError={() => setImageError(true)}
            />
          )}
          <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
        </Avatar>
        {showStatus && user.status && (
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
              user.status,
            )}`}
          />
        )}
      </div>
      <div className="ml-3">
        <div className="flex items-center">
          <span className={`font-medium ${nameSizes[size]}`}>{user.name || "User"}</span>
          {showBadge && user.is_approved === false && (
            <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs">
              Pending
            </Badge>
          )}
        </div>
        {showRole && user.role && (
          <span className={`text-xs ${getRoleBadgeColor(user.role)} px-2 py-0.5 rounded-full`}>
            {getFormattedRole(user.role)}
          </span>
        )}
      </div>
    </div>
  )
}

export function UserProfileCard({ user }: { user: UserType }) {
  if (!user) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.profile_image_url || "/placeholder.png"} alt={user.name || "User"} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{user.name || "User"}</h2>
          <Badge className={`mt-1 ${user.role ? getRoleBadgeColor(user.role) : ""}`}>
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            <span>{user.phone_number || "Not provided"}</span>
          </div>
          {user.business_name && (
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              <span>{user.business_name}</span>
            </div>
          )}
          {user.pin_code && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>PIN: {user.pin_code}</span>
            </div>
          )}
          {user.created_at && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          )}
          {user.gst_number && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span>GST: {user.gst_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "retailer":
      return "bg-green-100 text-green-800 border-green-200"
    case "wholesaler":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "delivery":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "admin":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}
