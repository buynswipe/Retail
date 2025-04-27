"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"

export default function SchemaPage() {
  const [loading, setLoading] = useState(true)
  const [schemaData, setSchemaData] = useState<any>(null)
  const [zoom, setZoom] = useState(1)
  const [activeTab, setActiveTab] = useState("visual")

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setLoading(true)
        // In a real implementation, this would fetch the actual schema data
        const response = await fetch("/api/schema")
        const data = await response.json()
        setSchemaData(data)
      } catch (error) {
        console.error("Failed to fetch schema:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchema()
  }, [])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleRefresh = async () => {
    setLoading(true)
    // In a real implementation, this would refresh the schema data
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const handleDownload = () => {
    // In a real implementation, this would download the schema diagram
    const link = document.createElement("a")
    link.href = "/placeholder.svg?key=g1hwa"
    link.download = "retail-bandhu-schema.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Database Schema</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visual">Visual Schema</TabsTrigger>
          <TabsTrigger value="sql">SQL Definition</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Visual Database Schema</CardTitle>
              <CardDescription>Interactive visualization of the Retail Bandhu database schema</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center overflow-auto">
              {loading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    transition: "transform 0.2s ease",
                  }}
                  className="min-w-full"
                >
                  <img src="/placeholder.svg?key=qr69h" alt="Database Schema Diagram" className="border rounded-md" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sql">
          <Card>
            <CardHeader>
              <CardTitle>SQL Definition</CardTitle>
              <CardDescription>SQL statements used to create the database schema</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm">
                  {`-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  wholesaler_id UUID REFERENCES users(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID REFERENCES users(id),
  status TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- More tables omitted for brevity...`}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>Table Relationships</CardTitle>
              <CardDescription>Key relationships between database tables</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">users → products</h3>
                    <p className="text-sm text-muted-foreground">One-to-many: A wholesaler can have many products</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">users → orders</h3>
                    <p className="text-sm text-muted-foreground">One-to-many: A retailer can place many orders</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">orders → order_items</h3>
                    <p className="text-sm text-muted-foreground">One-to-many: An order can have many items</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">products → order_items</h3>
                    <p className="text-sm text-muted-foreground">One-to-many: A product can be in many order items</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">orders → deliveries</h3>
                    <p className="text-sm text-muted-foreground">One-to-one: An order has one delivery</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
