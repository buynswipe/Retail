"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { RoleManager, UserRoleBadge } from "@/app/components/role-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, UserCog } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  role: "admin" | "retailer" | "wholesaler" | "delivery"
  isApproved: boolean
  businessName?: string
  pinCode?: string
  createdAt: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function UserRolesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [approvalFilter, setApprovalFilter] = useState<string>("all")

  // Get query parameters
  const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1
  const role = searchParams.get("role")
  const approval = searchParams.get("approval")
  const search = searchParams.get("search")

  // Set initial state from URL
  useEffect(() => {
    if (role) setSelectedRole(role)
    if (approval) setApprovalFilter(approval)
    if (search) {
      setSearchTerm(search)
      setDebouncedSearchTerm(search)
    }
  }, [])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (page > 1) params.set("page", page.toString())
    if (selectedRole) params.set("role", selectedRole)
    if (approvalFilter !== "all") params.set("approval", approvalFilter)
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm)

    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl, { scroll: false })

    fetchUsers()
  }, [page, selectedRole, approvalFilter, debouncedSearchTerm])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      params.set("page", page.toString())
      params.set("limit", "10")
      if (selectedRole) params.set("role", selectedRole)
      if (approvalFilter !== "all") params.set("approval", approvalFilter)
      if (debouncedSearchTerm) params.set("search", debouncedSearchTerm)

      const response = await fetch(`/api/users?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (userId: string, newRole: "admin" | "retailer" | "wholesaler" | "delivery") => {
    // Update local state optimistically
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
  }

  const handleApprovalChange = (userId: string, isApproved: boolean) => {
    // Update local state optimistically
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, isApproved } : user)))
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false })
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    const pages = []
    const currentPage = pagination.page
    const totalPages = pagination.totalPages

    // Always show first page
    pages.push(
      <PaginationItem key="first">
        <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis1">
          <span className="px-4">...</span>
        </PaginationItem>,
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue // Skip first and last page as they're always shown
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis2">
          <span className="px-4">...</span>
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pages}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  const renderUserTable = () => {
    if (loading) {
      return Array(5)
        .fill(0)
        .map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-6 w-[200px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-[100px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-[200px]" />
            </TableCell>
          </TableRow>
        ))
    }

    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-8">
            No users found. Try adjusting your filters.
          </TableCell>
        </TableRow>
      )
    }

    return users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>
          <div className="font-medium">{user.name || "Unnamed User"}</div>
          <div className="text-sm text-muted-foreground">{user.email || user.phone || "No contact info"}</div>
          {user.businessName && (
            <div className="text-xs text-muted-foreground mt-1">
              {user.businessName} {user.pinCode && `(${user.pinCode})`}
            </div>
          )}
        </TableCell>
        <TableCell>
          <UserRoleBadge role={user.role} />
        </TableCell>
        <TableCell>
          <div className={`text-sm ${user.isApproved ? "text-green-600" : "text-amber-600"}`}>
            {user.isApproved ? "Approved" : "Pending"}
          </div>
        </TableCell>
        <TableCell>
          <RoleManager
            userId={user.id}
            initialRole={user.role}
            isApproved={user.isApproved}
            onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
            onApprovalChange={(isApproved) => handleApprovalChange(user.id, isApproved)}
          />
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">User Role Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-muted-foreground" />
              <span className="font-medium">{pagination.total} Users</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="delivery">Delivery Partner</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Tabs value={approvalFilter} onValueChange={setApprovalFilter} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderUserTable()}</TableBody>
            </Table>
          </div>

          {renderPagination()}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
