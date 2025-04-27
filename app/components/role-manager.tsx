"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type UserRole = "admin" | "retailer" | "wholesaler" | "delivery"

interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  role: UserRole
  isApproved: boolean
}

interface RoleManagerProps {
  userId: string
  initialRole: UserRole
  isApproved: boolean
  onRoleChange?: (newRole: UserRole) => void
  onApprovalChange?: (isApproved: boolean) => void
  disabled?: boolean
}

const roles = [
  {
    value: "admin",
    label: "Admin",
    icon: ShieldAlert,
    description: "Full access to all features",
  },
  {
    value: "retailer",
    label: "Retailer",
    icon: Shield,
    description: "Can browse and purchase products",
  },
  {
    value: "wholesaler",
    label: "Wholesaler",
    icon: ShieldCheck,
    description: "Can list and sell products",
  },
  {
    value: "delivery",
    label: "Delivery Partner",
    icon: ShieldX,
    description: "Can deliver orders",
  },
]

export function RoleManager({
  userId,
  initialRole,
  isApproved,
  onRoleChange,
  onApprovalChange,
  disabled = false,
}: RoleManagerProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<UserRole>(initialRole)
  const [approved, setApproved] = useState(isApproved)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setRole(initialRole)
    setApproved(isApproved)
  }, [initialRole, isApproved])

  const selectedRole = roles.find((r) => r.value === role)

  const handleRoleChange = async (newRole: UserRole) => {
    if (disabled || role === newRole) return

    setIsUpdating(true)
    try {
      // Call API to update user role
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      setRole(newRole)
      if (onRoleChange) onRoleChange(newRole)

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setOpen(false)
    }
  }

  const handleApprovalChange = async () => {
    if (disabled) return

    setIsUpdating(true)
    try {
      // Call API to update user approval status
      const response = await fetch(`/api/users/${userId}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved: !approved }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user approval status")
      }

      setApproved(!approved)
      if (onApprovalChange) onApprovalChange(!approved)

      toast({
        title: approved ? "User suspended" : "User approved",
        description: approved
          ? "User has been suspended and can no longer access the platform"
          : "User has been approved and can now access the platform",
      })
    } catch (error) {
      console.error("Error updating approval status:", error)
      toast({
        title: "Error",
        description: "Failed to update user approval status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!selectedRole) {
    return <Skeleton className="h-10 w-28" />
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
            disabled={disabled || isUpdating}
          >
            <div className="flex items-center gap-2">
              {selectedRole && <selectedRole.icon className="h-4 w-4" />}
              {selectedRole?.label || "Select role"}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search role..." />
              <CommandEmpty>No role found.</CommandEmpty>
              <CommandGroup>
                {roles.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => handleRoleChange(item.value as UserRole)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    <Check className={cn("ml-auto h-4 w-4", role === item.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant={approved ? "outline" : "default"}
        size="sm"
        onClick={handleApprovalChange}
        disabled={disabled || isUpdating}
        className={approved ? "border-green-500 text-green-500" : ""}
      >
        {approved ? "Approved" : "Pending"}
      </Button>
    </div>
  )
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  const roleInfo = roles.find((r) => r.value === role)

  if (!roleInfo) return null

  const Icon = roleInfo.icon

  const badgeVariant =
    role === "admin" ? "destructive" : role === "wholesaler" ? "default" : role === "retailer" ? "secondary" : "outline"

  return (
    <Badge variant={badgeVariant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {roleInfo.label}
    </Badge>
  )
}
