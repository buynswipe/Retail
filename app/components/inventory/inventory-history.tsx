"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react"
import type { InventoryTransaction, ProductBatch } from "@/lib/types"

interface InventoryHistoryProps {
  productName: string
  transactions: InventoryTransaction[]
  batches: ProductBatch[]
}

export function InventoryHistory({ productName, transactions, batches }: InventoryHistoryProps) {
  const [activeTab, setActiveTab] = useState("transactions")

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "increase":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />
      case "decrease":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "increase":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Increase
          </Badge>
        )
      case "decrease":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Decrease
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case "correction":
        return "Inventory Correction"
      case "damaged":
        return "Damaged/Expired"
      case "returned":
        return "Customer Return"
      case "supplier":
        return "Supplier Delivery"
      case "order":
        return "Order Fulfillment"
      default:
        return reason.charAt(0).toUpperCase() + reason.slice(1)
    }
  }

  const getBatchStatus = (batch: ProductBatch) => {
    const now = new Date()

    if (batch.quantity <= 0) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Depleted
        </Badge>
      )
    }

    if (batch.expiryDate && new Date(batch.expiryDate) < now) {
      return <Badge variant="destructive">Expired</Badge>
    }

    if (batch.expiryDate && new Date(batch.expiryDate) < new Date(now.setDate(now.getDate() + 30))) {
      return (
        <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600">
          Expiring Soon
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Active
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productName} - Inventory History</CardTitle>
        <CardDescription>Track inventory changes and batch information</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm")}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getTransactionIcon(transaction.type)}
                            <span className="ml-2">{getTransactionBadge(transaction.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{getReasonText(transaction.reason)}</TableCell>
                        <TableCell>{transaction.userName}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="batches" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Manufacturing Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No batches found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                        <TableCell>{batch.quantity}</TableCell>
                        <TableCell>
                          {batch.manufacturingDate ? format(new Date(batch.manufacturingDate), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {batch.expiryDate ? format(new Date(batch.expiryDate), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>{getBatchStatus(batch)}</TableCell>
                        <TableCell className="max-w-xs truncate">{batch.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
