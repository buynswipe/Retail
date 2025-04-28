"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TranslationProvider, useTranslation } from "../../components/translation-provider"
import Navbar from "../../components/navbar"
import { Package, Search, X, AlertCircle, Plus, DollarSign, ArrowUp, ArrowDown, History, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import {
  getInventoryByWholesaler,
  updateLowStockThreshold,
  createInventoryBatch,
  createInventoryAdjustment,
  getLowStockProducts,
} from "@/lib/inventory-service"
import type { Inventory } from "@/lib/inventory-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"

function InventoryContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Dialog states
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false)
  const [isAddBatchDialogOpen, setIsAddBatchDialogOpen] = useState(false)
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form states
  const [thresholdValue, setThresholdValue] = useState(5)
  const [batchForm, setBatchForm] = useState({
    batch_number: "",
    quantity: 0,
    manufacturing_date: "",
    expiry_date: "",
    cost_price: 0,
  })
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: 0,
    notes: "",
  })

  useEffect(() => {
    if (user) {
      loadInventory()
      loadLowStockItems()
    }
  }, [user])

  const loadInventory = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await getInventoryByWholesaler(user.id)
      if (error) {
        throw error
      }
      setInventory(data || [])
    } catch (error) {
      console.error("Error loading inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLowStockItems = async () => {
    if (!user) return

    try {
      const { data, error } = await getLowStockProducts(user.id)
      if (error) {
        throw error
      }
      setLowStockItems(data || [])
    } catch (error) {
      console.error("Error loading low stock items:", error)
    }
  }

  const handleOpenThresholdDialog = (product: any) => {
    setSelectedProduct(product)
    setThresholdValue(product.low_stock_threshold)
    setIsThresholdDialogOpen(true)
  }

  const handleOpenAddBatchDialog = (product: any) => {
    setSelectedProduct(product)
    setBatchForm({
      batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
      quantity: 0,
      manufacturing_date: "",
      expiry_date: "",
      cost_price: 0,
    })
    setIsAddBatchDialogOpen(true)
  }

  const handleOpenAdjustmentDialog = (product: any) => {
    setSelectedProduct(product)
    setAdjustmentForm({
      quantity: 0,
      notes: "",
    })
    setIsAdjustmentDialogOpen(true)
  }

  const handleUpdateThreshold = async () => {
    if (!selectedProduct) return

    setIsProcessing(true)
    try {
      const { success, error } = await updateLowStockThreshold(selectedProduct.id, thresholdValue)

      if (!success) {
        throw error
      }

      toast({
        title: "Success",
        description: "Low stock threshold updated successfully.",
      })

      // Update local state
      setInventory(
        inventory.map((item) =>
          item.id === selectedProduct.id ? { ...item, low_stock_threshold: thresholdValue } : item,
        ),
      )

      setIsThresholdDialogOpen(false)
    } catch (error) {
      console.error("Error updating threshold:", error)
      toast({
        title: "Error",
        description: "Failed to update threshold. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddBatch = async () => {
    if (!selectedProduct || !user) return

    setIsProcessing(true)
    try {
      if (batchForm.quantity <= 0) {
        throw new Error("Quantity must be greater than zero")
      }

      if (batchForm.cost_price <= 0) {
        throw new Error("Cost price must be greater than zero")
      }

      const { data, error } = await createInventoryBatch({
        product_id: selectedProduct.product.id,
        batch_number: batchForm.batch_number,
        quantity: batchForm.quantity,
        manufacturing_date: batchForm.manufacturing_date || undefined,
        expiry_date: batchForm.expiry_date || undefined,
        cost_price: batchForm.cost_price,
        created_by: user.id,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Inventory batch added successfully.",
      })

      // Update local state
      loadInventory()
      loadLowStockItems()

      setIsAddBatchDialogOpen(false)
    } catch (error) {
      console.error("Error adding batch:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add batch. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInventoryAdjustment = async () => {
    if (!selectedProduct || !user) return

    setIsProcessing(true)
    try {
      if (adjustmentForm.quantity === 0) {
        throw new Error("Adjustment quantity cannot be zero")
      }

      const { success, error } = await createInventoryAdjustment({
        product_id: selectedProduct.product.id,
        transaction_type: "adjustment",
        quantity: adjustmentForm.quantity,
        notes: adjustmentForm.notes,
        created_by: user.id,
      })

      if (!success) {
        throw error
      }

      toast({
        title: "Success",
        description: "Inventory adjustment recorded successfully.",
      })

      // Update local state
      loadInventory()
      loadLowStockItems()

      setIsAdjustmentDialogOpen(false)
    } catch (error) {
      console.error("Error adjusting inventory:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to adjust inventory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter inventory based on search query and active tab
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product?.description && item.product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    if (activeTab === "all") {
      return matchesSearch
    } else if (activeTab === "low") {
      return matchesSearch && item.current_quantity <= item.low_stock_threshold
    }

    return matchesSearch
  })

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <h3 className="text-3xl font-bold">{inventory.length}</h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <h3 className="text-3xl font-bold">{lowStockItems.length}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
                <h3 className="text-3xl font-bold">
                  ₹
                  {inventory
                    .reduce((sum, item) => sum + item.current_quantity * (item.product?.price || 0), 0)
                    .toFixed(2)}
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="low" className="flex items-center gap-1">
              Low Stock
              {lowStockItems.length > 0 && <Badge className="bg-red-500 ml-1">{lowStockItems.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Loading inventory...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">
            {searchQuery ? "No products match your search" : "No products in inventory"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Low Stock Threshold</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.current_quantity <= item.low_stock_threshold
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url || "/placeholder.svg"}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-sm text-gray-500">₹{item.product?.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isLowStock ? "text-red-500 font-bold" : ""}>{item.current_quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                      <TableCell className="text-right">
                        ₹{(item.current_quantity * (item.product?.price || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{format(new Date(item.last_updated), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenAddBatchDialog(item)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Stock
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenAdjustmentDialog(item)}>
                            <ArrowUp className="h-4 w-4" />
                            <ArrowDown className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenThresholdDialog(item)}>
                            <Settings className="h-4 w-4 mr-1" />
                            Threshold
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/wholesaler/inventory/${item.product?.id}`}>
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Threshold Dialog */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Low Stock Threshold</DialogTitle>
            <DialogDescription>
              Set the minimum quantity at which you want to receive low stock alerts for{" "}
              {selectedProduct?.product?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(Number.parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500">You will receive alerts when stock falls below this quantity.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsThresholdDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateThreshold} disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Update Threshold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Batch Dialog */}
      <Dialog open={isAddBatchDialogOpen} onOpenChange={setIsAddBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Batch</DialogTitle>
            <DialogDescription>
              Add a new batch of {selectedProduct?.product?.name} to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={batchForm.batch_number}
                onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm({ ...batchForm, quantity: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturing_date">Manufacturing Date (Optional)</Label>
                <Input
                  id="manufacturing_date"
                  type="date"
                  value={batchForm.manufacturing_date}
                  onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (₹)</Label>
              <Input
                id="cost_price"
                type="number"
                min="0.01"
                step="0.01"
                value={batchForm.cost_price}
                onChange={(e) => setBatchForm({ ...batchForm, cost_price: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBatch} disabled={isProcessing}>
              {isProcessing ? "Adding..." : "Add Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              Make manual adjustments to the inventory of {selectedProduct?.product?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment_quantity">Adjustment Quantity</Label>
              <Input
                id="adjustment_quantity"
                type="number"
                value={adjustmentForm.quantity}
                onChange={(e) =>
                  setAdjustmentForm({ ...adjustmentForm, quantity: Number.parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-sm text-gray-500">
                Use positive numbers to add stock and negative numbers to remove stock.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment_notes">Notes</Label>
              <Textarea
                id="adjustment_notes"
                placeholder="Reason for adjustment..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInventoryAdjustment} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <TranslationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-20 px-4">
          <InventoryContent />
        </main>
      </div>
    </TranslationProvider>
  )
}
