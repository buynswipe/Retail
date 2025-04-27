"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Code, AlertCircle, CheckCircle, ArrowUpDown, Play, Plus, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Migration {
  id: string
  name: string
  description: string
  status: "pending" | "applied" | "failed"
  created_at: string
  applied_at?: string
  sql: string
}

export default function MigrationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [newMigrationName, setNewMigrationName] = useState("")
  const [newMigrationDescription, setNewMigrationDescription] = useState("")
  const [newMigrationSQL, setNewMigrationSQL] = useState("")
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    // Simulate loading migrations
    const loadMigrations = async () => {
      setLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data
      const mockMigrations: Migration[] = [
        {
          id: "1",
          name: "initial_schema",
          description: "Initial database schema",
          status: "applied",
          created_at: "2023-01-15T10:00:00Z",
          applied_at: "2023-01-15T10:05:00Z",
          sql: "CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, role TEXT);",
        },
        {
          id: "2",
          name: "add_products_table",
          description: "Add products table",
          status: "applied",
          created_at: "2023-02-10T14:30:00Z",
          applied_at: "2023-02-10T14:35:00Z",
          sql: "CREATE TABLE products (id UUID PRIMARY KEY, name TEXT, price DECIMAL);",
        },
        {
          id: "3",
          name: "add_orders_table",
          description: "Add orders table",
          status: "applied",
          created_at: "2023-03-05T09:15:00Z",
          applied_at: "2023-03-05T09:20:00Z",
          sql: "CREATE TABLE orders (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), total DECIMAL);",
        },
        {
          id: "4",
          name: "add_user_preferences",
          description: "Add user preferences table",
          status: "pending",
          created_at: "2023-04-20T11:45:00Z",
          sql: "CREATE TABLE user_preferences (user_id UUID REFERENCES users(id), theme TEXT, notifications BOOLEAN);",
        },
        {
          id: "5",
          name: "add_delivery_tracking",
          description: "Add delivery tracking table",
          status: "pending",
          created_at: "2023-05-12T16:20:00Z",
          sql: "CREATE TABLE delivery_tracking (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), status TEXT, location TEXT);",
        },
      ]

      setMigrations(mockMigrations)
      setLoading(false)
    }

    loadMigrations()
  }, [])

  const handleCreateMigration = async () => {
    if (!newMigrationName || !newMigrationSQL) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and SQL for the migration.",
        variant: "destructive",
      })
      return
    }

    // Simulate creating a migration
    const newMigration: Migration = {
      id: `${migrations.length + 1}`,
      name: newMigrationName.toLowerCase().replace(/\s+/g, "_"),
      description: newMigrationDescription || newMigrationName,
      status: "pending",
      created_at: new Date().toISOString(),
      sql: newMigrationSQL,
    }

    setMigrations([...migrations, newMigration])
    setOpenDialog(false)

    // Reset form
    setNewMigrationName("")
    setNewMigrationDescription("")
    setNewMigrationSQL("")

    toast({
      title: "Migration Created",
      description: "The migration has been created successfully.",
    })
  }

  const handleApplyMigration = async (migrationId: string) => {
    setApplying(true)

    // Find the migration
    const migration = migrations.find((m) => m.id === migrationId)
    if (!migration) {
      setApplying(false)
      return
    }

    // Simulate applying the migration
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update the migration status
    const updatedMigrations = migrations.map((m) => {
      if (m.id === migrationId) {
        return {
          ...m,
          status: "applied",
          applied_at: new Date().toISOString(),
        }
      }
      return m
    })

    setMigrations(updatedMigrations)
    setApplying(false)

    toast({
      title: "Migration Applied",
      description: `Migration "${migration.name}" has been applied successfully.`,
    })
  }

  const handleApplyAllPending = async () => {
    setApplying(true)

    // Get all pending migrations
    const pendingMigrations = migrations.filter((m) => m.status === "pending")

    if (pendingMigrations.length === 0) {
      setApplying(false)
      toast({
        title: "No Pending Migrations",
        description: "There are no pending migrations to apply.",
      })
      return
    }

    // Simulate applying migrations one by one
    for (const migration of pendingMigrations) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the migration status
      setMigrations((prev) =>
        prev.map((m) => {
          if (m.id === migration.id) {
            return {
              ...m,
              status: "applied",
              applied_at: new Date().toISOString(),
            }
          }
          return m
        }),
      )
    }

    setApplying(false)

    toast({
      title: "Migrations Applied",
      description: `${pendingMigrations.length} migrations have been applied successfully.`,
    })
  }

  const filteredMigrations = migrations.filter((migration) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return migration.status === "pending"
    if (activeTab === "applied") return migration.status === "applied"
    return true
  })

  const renderMigrationsList = () => {
    if (loading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))
    }

    if (filteredMigrations.length === 0) {
      return (
        <Card className="mb-4">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No migrations found.</p>
          </CardContent>
        </Card>
      )
    }

    return filteredMigrations.map((migration) => (
      <Card key={migration.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{migration.name}</CardTitle>
            <Badge variant={migration.status === "applied" ? "default" : "secondary"}>{migration.status}</Badge>
          </div>
          <CardDescription>{migration.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="bg-muted p-2 rounded-md overflow-x-auto">
            <pre className="text-xs">{migration.sql}</pre>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Created: {new Date(migration.created_at).toLocaleString()}</span>
            {migration.applied_at && <span>Applied: {new Date(migration.applied_at).toLocaleString()}</span>}
          </div>
        </CardContent>
        <CardFooter>
          {migration.status === "pending" && (
            <Button
              onClick={() => handleApplyMigration(migration.id)}
              disabled={applying}
              className="flex items-center gap-2"
            >
              {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Apply Migration
            </Button>
          )}
        </CardFooter>
      </Card>
    ))
  }

  const pendingCount = migrations.filter((m) => m.status === "pending").length
  const appliedCount = migrations.filter((m) => m.status === "applied").length

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Database Migrations</h1>
          <p className="text-muted-foreground">Manage database schema changes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-muted-foreground">
              {migrations.length} Total
            </Badge>
            <Badge variant="secondary">{pendingCount} Pending</Badge>
            <Badge>{appliedCount} Applied</Badge>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Migration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Migration</DialogTitle>
                <DialogDescription>
                  Create a new database migration. This will generate a new migration file that can be applied to the
                  database.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Migration Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., add_user_fields"
                    value={newMigrationName}
                    onChange={(e) => setNewMigrationName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the migration"
                    value={newMigrationDescription}
                    onChange={(e) => setNewMigrationDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sql">SQL</Label>
                  <Textarea
                    id="sql"
                    placeholder="Enter SQL statements..."
                    rows={10}
                    value={newMigrationSQL}
                    onChange={(e) => setNewMigrationSQL(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMigration}>Create Migration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pendingCount > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Migrations</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>There are {pendingCount} pending migrations that need to be applied.</span>
            <Button onClick={handleApplyAllPending} disabled={applying} className="flex items-center gap-2">
              {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUpDown className="h-4 w-4" />}
              Apply All Pending
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {pendingCount === 0 && migrations.length > 0 && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-800" />
          <AlertTitle>Database Up to Date</AlertTitle>
          <AlertDescription>All migrations have been applied. Your database schema is up to date.</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            All Migrations
            <Badge variant="outline" className="ml-2">
              {migrations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending
            <Badge variant="outline" className="ml-2">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Applied
            <Badge variant="outline" className="ml-2">
              {appliedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderMigrationsList()}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {renderMigrationsList()}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {renderMigrationsList()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
