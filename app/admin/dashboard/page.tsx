"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, BarChart3, Settings, AlertTriangle, Database, Shield, GitBranch, TestTube } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/users" className="w-full">
                  <Button variant="outline" className="w-full">
                    View All Users
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">All Systems Operational</div>
                <p className="text-xs text-muted-foreground">Last checked 5 minutes ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/system-status" className="w-full">
                  <Button variant="outline" className="w-full">
                    View System Status
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5K Orders</div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/analytics" className="w-full">
                  <Button variant="outline" className="w-full">
                    View Analytics
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Audit</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">No Issues</div>
                <p className="text-xs text-muted-foreground">Last audit: 2 days ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/security-audit" className="w-full">
                  <Button variant="outline" className="w-full">
                    Run Security Audit
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Schema</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15 Tables</div>
                <p className="text-xs text-muted-foreground">Last updated: 1 week ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/schema" className="w-full">
                  <Button variant="outline" className="w-full">
                    View Schema
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">System Settings</div>
                <p className="text-xs text-muted-foreground">Last modified: 3 days ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/configuration" className="w-full">
                  <Button variant="outline" className="w-full">
                    Manage Configuration
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users and their roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/users">
                <Button className="mr-2">View All Users</Button>
              </Link>
              <Link href="/admin/roles">
                <Button variant="outline">Manage Roles</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>View detailed analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics">
                <Button>View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Monitor system health and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/system-status">
                  <Button className="mr-2">View System Status</Button>
                </Link>
                <Link href="/admin/performance">
                  <Button variant="outline">Performance Monitoring</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Manage system configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/configuration">
                  <Button>Manage Configuration</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Migrations</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5 Pending</div>
                <p className="text-xs text-muted-foreground">Last migration: 2 days ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/migrations" className="w-full">
                  <Button variant="outline" className="w-full">
                    Manage Migrations
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RLS Policy Testing</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">All Tests Passing</div>
                <p className="text-xs text-muted-foreground">Last test: 1 day ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/rls-testing" className="w-full">
                  <Button variant="outline" className="w-full">
                    Run RLS Tests
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automated Testing</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98% Coverage</div>
                <p className="text-xs text-muted-foreground">Last run: 12 hours ago</p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/testing" className="w-full">
                  <Button variant="outline" className="w-full">
                    Run Tests
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Database Schema</CardTitle>
                <CardDescription>View and manage database schema</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/schema">
                  <Button>View Schema</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Audit</CardTitle>
                <CardDescription>Run security audits and view reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/security-audit">
                  <Button>Run Security Audit</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
