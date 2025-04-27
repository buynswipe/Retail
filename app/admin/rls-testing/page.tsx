"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShoppingCart,
  CreditCard,
  Truck,
  MessageSquare,
} from "lucide-react"

interface RLSTest {
  id: string
  table: string
  operation: "select" | "insert" | "update" | "delete"
  role: "admin" | "retailer" | "wholesaler" | "delivery" | "anonymous"
  condition: string
  expected: boolean
  result?: boolean
  error?: string
}

interface TableInfo {
  name: string
  icon: React.ElementType
  description: string
}

export default function RLSTestingPage() {
  const [activeTab, setActiveTab] = useState("run")
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [tests, setTests] = useState<RLSTest[]>([])
  const [results, setResults] = useState<RLSTest[]>([])

  const tables: Record<string, TableInfo> = {
    users: {
      name: "Users",
      icon: Users,
      description: "User accounts and profiles",
    },
    products: {
      name: "Products",
      icon: ShoppingCart,
      description: "Product catalog",
    },
    orders: {
      name: "Orders",
      icon: ShoppingCart,
      description: "Customer orders",
    },
    payments: {
      name: "Payments",
      icon: CreditCard,
      description: "Payment transactions",
    },
    delivery_assignments: {
      name: "Delivery Assignments",
      icon: Truck,
      description: "Delivery partner assignments",
    },
    notifications: {
      name: "Notifications",
      icon: MessageSquare,
      description: "User notifications",
    },
  }

  const roles = [
    { value: "admin", label: "Admin" },
    { value: "retailer", label: "Retailer" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "delivery", label: "Delivery Partner" },
    { value: "anonymous", label: "Anonymous" },
  ]

  const runTests = async () => {
    setRunning(true)
    setResults([])

    // Generate tests based on selected table and role
    const generatedTests = generateTests(selectedTable, selectedRole)
    setTests(generatedTests)

    // Simulate running tests
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate test results
    const testResults = generatedTests.map((test) => {
      // Simulate some failures for demonstration
      const passed = Math.random() > 0.2

      // If test is expected to pass but failed, or vice versa
      const result = test.expected === passed

      return {
        ...test,
        result,
        error: !result ? "Unexpected access control behavior" : undefined,
      }
    })

    setResults(testResults)
    setRunning(false)

    // Show toast with summary
    const passedCount = testResults.filter((t) => t.result).length
    const totalCount = testResults.length

    if (passedCount === totalCount) {
      toast({
        title: "All Tests Passed",
        description: `${passedCount} of ${totalCount} tests passed successfully.`,
      })
    } else {
      toast({
        title: "Some Tests Failed",
        description: `${passedCount} of ${totalCount} tests passed. Please review the failures.`,
        variant: "destructive",
      })
    }
  }

  const generateTests = (table: string | null, role: string | null): RLSTest[] => {
    if (!table || !role) return []

    const tests: RLSTest[] = []

    // Generate tests based on table and role
    switch (table) {
      case "users":
        tests.push(
          {
            id: "1",
            table: "users",
            operation: "select",
            role: role as any,
            condition: "User can read their own data",
            expected: true,
          },
          {
            id: "2",
            table: "users",
            operation: "select",
            role: role as any,
            condition: "User can read another user's data",
            expected: role === "admin",
          },
          {
            id: "3",
            table: "users",
            operation: "update",
            role: role as any,
            condition: "User can update their own data",
            expected: true,
          },
          {
            id: "4",
            table: "users",
            operation: "update",
            role: role as any,
            condition: "User can update another user's data",
            expected: role === "admin",
          },
          {
            id: "5",
            table: "users",
            operation: "delete",
            role: role as any,
            condition: "User can delete their own data",
            expected: false, // Nobody should delete user data
          },
        )
        break

      case "products":
        tests.push(
          {
            id: "1",
            table: "products",
            operation: "select",
            role: role as any,
            condition: "User can read products",
            expected: true, // All roles can read products
          },
          {
            id: "2",
            table: "products",
            operation: "insert",
            role: role as any,
            condition: "User can create products",
            expected: role === "admin" || role === "wholesaler",
          },
          {
            id: "3",
            table: "products",
            operation: "update",
            role: role as any,
            condition: "User can update their own products",
            expected: role === "admin" || role === "wholesaler",
          },
          {
            id: "4",
            table: "products",
            operation: "update",
            role: role as any,
            condition: "User can update another user's products",
            expected: role === "admin",
          },
          {
            id: "5",
            table: "products",
            operation: "delete",
            role: role as any,
            condition: "User can delete products",
            expected: role === "admin" || role === "wholesaler",
          },
        )
        break

      case "orders":
        tests.push(
          {
            id: "1",
            table: "orders",
            operation: "select",
            role: role as any,
            condition: "User can read their own orders",
            expected: true,
          },
          {
            id: "2",
            table: "orders",
            operation: "select",
            role: role as any,
            condition: "User can read orders they're involved with",
            expected: role !== "anonymous",
          },
          {
            id: "3",
            table: "orders",
            operation: "select",
            role: role as any,
            condition: "User can read all orders",
            expected: role === "admin",
          },
          {
            id: "4",
            table: "orders",
            operation: "insert",
            role: role as any,
            condition: "User can create orders",
            expected: role === "retailer" || role === "admin",
          },
          {
            id: "5",
            table: "orders",
            operation: "update",
            role: role as any,
            condition: "User can update order status",
            expected: role === "admin" || role === "wholesaler" || role === "delivery",
          },
        )
        break

      // Add more cases for other tables
      default:
        // Generic tests for any table
        tests.push(
          {
            id: "1",
            table,
            operation: "select",
            role: role as any,
            condition: `${role} can read from ${table}`,
            expected: role !== "anonymous",
          },
          {
            id: "2",
            table,
            operation: "insert",
            role: role as any,
            condition: `${role} can insert into ${table}`,
            expected: role === "admin",
          },
          {
            id: "3",
            table,
            operation: "update",
            role: role as any,
            condition: `${role} can update ${table}`,
            expected: role === "admin",
          },
          {
            id: "4",
            table,
            operation: "delete",
            role: role as any,
            condition: `${role} can delete from ${table}`,
            expected: role === "admin",
          },
        )
    }

    return tests
  }

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case "select":
        return <Badge className="bg-blue-500">SELECT</Badge>
      case "insert":
        return <Badge className="bg-green-500">INSERT</Badge>
      case "update":
        return <Badge className="bg-amber-500">UPDATE</Badge>
      case "delete":
        return <Badge variant="destructive">DELETE</Badge>
      default:
        return <Badge>{operation}</Badge>
    }
  }

  const getResultIcon = (test: RLSTest) => {
    if (test.result === undefined) return null

    if (test.result) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
  }

  const renderTestResults = () => {
    if (running) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Running RLS Tests...</p>
          <p className="text-sm text-muted-foreground">This may take a few moments</p>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No Test Results</p>
          <p className="text-sm text-muted-foreground">Let's create a loading state for the RLS testing page:</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((test) => (
              <TableRow key={test.id}>
                <TableCell>{tables[test.table]?.name || test.table}</TableCell>
                <TableCell>{getOperationBadge(test.operation)}</TableCell>
                <TableCell>{roles.find((r) => r.value === test.role)?.label || test.role}</TableCell>
                <TableCell>{test.condition}</TableCell>
                <TableCell>{test.expected ? "Yes" : "No"}</TableCell>
                <TableCell className="flex items-center">{getResultIcon(test)}</TableCell>
                <TableCell>{test.error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Row Level Security Testing</CardTitle>
          <CardDescription>Simulate and test row level security policies for your database tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="run" className="space-y-4">
            <TabsList>
              <TabsTrigger value="run" onClick={() => setActiveTab("run")}>
                Run Tests
              </TabsTrigger>
              <TabsTrigger value="results" onClick={() => setActiveTab("results")}>
                Test Results
              </TabsTrigger>
            </TabsList>
            <TabsContent value="run" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select onValueChange={setSelectedTable}>
                    <SelectTrigger className="w-[100%]">
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tables</SelectLabel>
                        {Object.entries(tables).map(([key, table]) => (
                          <SelectItem key={key} value={key}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {selectedTable && (
                    <Alert className="mt-2">
                      <Database className="h-4 w-4" />
                      <AlertTitle>{tables[selectedTable].name}</AlertTitle>
                      <AlertDescription>{tables[selectedTable].description}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div>
                  <Select onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[100%]">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={runTests} disabled={running || !selectedTable || !selectedRole}>
                {running ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Tests"
                )}
              </Button>
            </TabsContent>
            <TabsContent value="results">{renderTestResults()}</TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">{tests.length} tests defined</p>
          <p className="text-sm text-muted-foreground">
            {results.filter((t) => t.result).length} passed / {results.length} total
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
