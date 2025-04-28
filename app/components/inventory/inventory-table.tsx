"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MoreVertical, Search, Package, History, Edit, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { InventoryItem } from "@/lib/types"

interface InventoryTableProps {
  inventoryItems: InventoryItem[]
  onAdjustStock: (productId: string, adjustment: number) => void
  onAddBatch: (productId: string) => void
}

export function InventoryTable({ inventoryItems, onAdjustStock, onAddBatch }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStockStatusBadge = (quantity: number, threshold: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity <= threshold) {
      return (
        <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
          In Stock
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push("/wholesaler/products/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Batches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-gray-100 p-1 mr-3">
                        <Package className="h-8 w-8 text-gray-500" />
                      </div>
                      {item.product.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell>
                    {item.quantity} {item.product.unit}
                  </TableCell>
                  <TableCell>{item.batchCount}</TableCell>
                  <TableCell>{getStockStatusBadge(item.quantity, item.lowStockThreshold)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAdjustStock(item.product.id, 0)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddBatch(item.product.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Batch
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/wholesaler/inventory/${item.product.id}`}>
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/wholesaler/products/${item.product.id}`}>
                            <Package className="mr-2 h-4 w-4" />
                            Edit Product
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
