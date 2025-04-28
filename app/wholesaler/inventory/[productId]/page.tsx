"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationProvider, useTranslation } from "../../../components/translation-provider"
import Navbar from "../../../components/navbar"
import { Package, ArrowLeft, Calendar, Clock, ArrowUp, ArrowDown, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { getInventoryByProduct, getInventoryBatches, getInventoryTransactions } from "@/lib/inventory-service"
import { getProductById } from "@/lib/product-service"
import type { InventoryBatch, InventoryTransaction } from "@/lib/inventory-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { useParams } from "next/navigation"

function InventoryHistoryContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const params = useParams()
  const productId = params.productId as string

  const [product, setProduct] = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("transactions")

  useEffect(() => {
    if (user && productId) {
      loadProductData()
    }
  }, [user, productId])

  const loadProductData = async () => {
    setIsLoading(true)
    try {
      // Load product details
      const { data: productData, error: productError } = await getProductById(productId)
      if (productError) throw productError
      setProduct(productData)

      // Load inventory
      const { data: inventoryData, error: inventoryError } = await getInventoryByProduct(productId)
      if (inventoryError) throw inventoryError
      setInventory(inventoryData)

      // Load batches
      const { data: batchesData, error: batchesError } = await getInventoryBatches(productId)
      if (batchesError) throw batchesError
      setBatches(batchesData || [])

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await getInventoryTransactions(productId)
      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error("Error loading product data:", error)
      toast({
        title: "Error",
        description: "Failed to load product data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-green-500"
      case "sale":
        return "bg-blue-500"
      case "adjustment":
        return "bg-orange-500"
      case "return":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTransactionIcon = (type: string, quantity: number) => {
    if (type === "purchase" || (type === "adjustment" && quantity > 0)) {
      return <ArrowUp className="h-4 w-4 text-green-500" />
    } else if (type === "sale" || (type === "adjustment" && quantity < 0)) {
      return <ArrowDown className="h-4 w-4 text-red-500" />
    } else if (type === "return") {
      return <ArrowUp className="h-4 w-4 text-purple-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Loading product data...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Product not found</p>
          <Button asChild className="mt-4">
            <Link href="/wholesaler/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory History</h1>
        <Button asChild variant="outline">
          <Link href="/wholesaler/inventory">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      {/* Product Info */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <p className="text-gray-500">{product.description}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="text-xl font-bold">{inventory?.current_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Threshold</p>
                  <p className="text-xl font-bold">{inventory?.low_stock_threshold || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Selling Price</p>
                  <p className="text-xl font-bold">₹{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Value</p>
                  <p className="text-xl font-bold">
                    ₹{((inventory?.current_quantity || 0) * product.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions History</TabsTrigger>
          <TabsTrigger value="batches">Batch Information</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions Tab */}
      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg text-gray-500">No transactions found for this product</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{format(new Date(transaction.created_at), "dd MMM yyyy HH:mm")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                          {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getTransactionIcon(transaction.transaction_type, transaction.quantity)}
                          <span className={transaction.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {transaction.quantity > 0 ? "+" : ""}
                            {transaction.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.reference_type && (
                          <span className="text-sm text-gray-500">
                            {transaction.reference_type.charAt(0).toUpperCase() + transaction.reference_type.slice(1)}
                            {transaction.reference_id ? ` #${transaction.reference_id.slice(0, 8)}` : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{transaction.notes || "-"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Batches Tab */}
      <TabsContent value="batches">
        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {batches.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg text-gray-500">No batch information found for this product</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead>Manufacturing Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.batch_number}</TableCell>
                      <TableCell className="text-right">{batch.quantity}</TableCell>
                      <TableCell className="text-right">₹{batch.cost_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {batch.manufacturing_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{format(new Date(batch.manufacturing_date), "dd MMM yyyy")}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {batch.expiry_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{format(new Date(batch.expiry_date), "dd MMM yyyy")}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{format(new Date(batch.created_at), "dd MMM yyyy")}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <Toaster />
    </div>
  )
}

export default function InventoryHistoryPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <InventoryHistoryContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
