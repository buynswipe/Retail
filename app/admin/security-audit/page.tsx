"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Download,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AuditResult {
  id: string
  name: string
  description: string
  status: "pass" | "fail" | "warning"
  details?: string
  recommendation?: string
  category: "auth" | "database" | "api" | "frontend"
}

export default function SecurityAuditPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AuditResult[]>([])
  const [lastRun, setLastRun] = useState<string | null>(null)

  // Simulate loading saved results
  useEffect(() => {
    const savedResults = localStorage.getItem("securityAuditResults")
    const savedTimestamp = localStorage.getItem("securityAuditTimestamp")

    if (savedResults) {
      setResults(JSON.parse(savedResults))
    }

    if (savedTimestamp) {
      setLastRun(savedTimestamp)
    }
  }, [])

  const runAudit = async () => {
    setIsRunning(true)
    setProgress(0)

    // Simulate audit process
    const mockResults: AuditResult[] = []
    const totalSteps = 20

    for (let i = 0; i < totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(Math.round(((i + 1) / totalSteps) * 100))

      // Add mock results as we go
      if (i === 4) {
        mockResults.push({
          id: "auth-1",
          name: "JWT Secret Strength",
          description: "Checks if JWT secret is sufficiently strong",
          status: "pass",
          details: "JWT secret meets minimum length requirements",
          category: "auth",
        })
      }

      if (i === 8) {
        mockResults.push({
          id: "db-1",
          name: "RLS Policies",
          description: "Checks if Row Level Security policies are in place",
          status: "warning",
          details: "RLS is enabled but some tables are missing policies",
          recommendation: "Add RLS policies to the following tables: notifications, system_logs",
          category: "database",
        })
      }

      if (i === 12) {
        mockResults.push({
          id: "api-1",
          name: "API Rate Limiting",
          description: "Checks if API endpoints have rate limiting",
          status: "fail",
          details: "No rate limiting detected on public API endpoints",
          recommendation: "Implement rate limiting middleware for all public API routes",
          category: "api",
        })
      }

      if (i === 16) {
        mockResults.push({
          id: "frontend-1",
          name: "Content Security Policy",
          description: "Checks if CSP headers are properly configured",
          status: "pass",
          details: "CSP headers are properly set",
          category: "frontend",
        })
      }
    }

    // Add more mock results
    mockResults.push(
      {
        id: "auth-2",
        name: "Password Policies",
        description: "Checks if password policies are enforced",
        status: "pass",
        details: "Password complexity requirements are enforced",
        category: "auth",
      },
      {
        id: "db-2",
        name: "Database Encryption",
        description: "Checks if sensitive data is encrypted",
        status: "warning",
        details: "Some sensitive fields are not encrypted",
        recommendation: "Encrypt the following fields: bank_account_number, bank_ifsc",
        category: "database",
      },
      {
        id: "api-2",
        name: "Input Validation",
        description: "Checks if API inputs are properly validated",
        status: "pass",
        details: "Input validation is implemented on all endpoints",
        category: "api",
      },
      {
        id: "frontend-2",
        name: "XSS Protection",
        description: "Checks for Cross-Site Scripting vulnerabilities",
        status: "pass",
        details: "No XSS vulnerabilities detected",
        category: "frontend",
      },
    )

    setResults(mockResults)
    setIsRunning(false)

    const timestamp = new Date().toISOString()
    setLastRun(timestamp)

    // Save results to localStorage
    localStorage.setItem("securityAuditResults", JSON.stringify(mockResults))
    localStorage.setItem("securityAuditTimestamp", timestamp)

    toast({
      title: "Security Audit Complete",
      description: "The security audit has been completed successfully.",
    })
  }

  const getStatusCounts = () => {
    return {
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      warning: results.filter((r) => r.status === "warning").length,
      total: results.length,
    }
  }

  const getStatusIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
  }

  const getStatusBadge = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-500">Pass</Badge>
      case "fail":
        return <Badge variant="destructive">Fail</Badge>
      case "warning":
        return <Badge className="bg-amber-500">Warning</Badge>
    }
  }

  const getCategoryIcon = (category: "auth" | "database" | "api" | "frontend") => {
    switch (category) {
      case "auth":
        return <Shield className="h-4 w-4" />
      case "database":
        return <ShieldCheck className="h-4 w-4" />
      case "api":
        return <ShieldAlert className="h-4 w-4" />
      case "frontend":
        return <Shield className="h-4 w-4" />
    }
  }

  const downloadReport = () => {
    if (results.length === 0) return

    const counts = getStatusCounts()
    const report = {
      timestamp: lastRun,
      summary: {
        total: counts.total,
        pass: counts.pass,
        fail: counts.fail,
        warning: counts.warning,
        score: Math.round((counts.pass / counts.total) * 100),
      },
      results,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-audit-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Report Downloaded",
      description: "The security audit report has been downloaded.",
    })
  }

  const renderOverview = () => {
    const counts = getStatusCounts()
    const score = counts.total > 0 ? Math.round((counts.pass / counts.total) * 100) : 0

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{score}%</div>
              <Progress value={score} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{counts.pass}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold">{counts.fail}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{counts.warning}</div>
            </CardContent>
          </Card>
        </div>

        {counts.fail > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Issues Detected</AlertTitle>
            <AlertDescription>
              {counts.fail} critical security {counts.fail === 1 ? "issue" : "issues"} found that require immediate
              attention.
            </AlertDescription>
          </Alert>
        )}

        {counts.fail === 0 && counts.warning > 0 && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <AlertTitle>Warnings Detected</AlertTitle>
            <AlertDescription>
              {counts.warning} security {counts.warning === 1 ? "warning" : "warnings"} found that should be addressed.
            </AlertDescription>
          </Alert>
        )}

        {counts.fail === 0 && counts.warning === 0 && counts.total > 0 && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-800" />
            <AlertTitle>All Checks Passed</AlertTitle>
            <AlertDescription>All security checks have passed. Your application is well-protected.</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div>
            {lastRun && (
              <p className="text-sm text-muted-foreground">Last audit: {new Date(lastRun).toLocaleString()}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadReport}
              disabled={results.length === 0 || isRunning}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={runAudit} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Run Security Audit
                </>
              )}
            </Button>
          </div>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running security audit...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    )
  }

  const renderResults = () => {
    if (results.length === 0) {
      return (
        <div className="text-center py-12">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Audit Results</h3>
          <p className="text-muted-foreground mb-6">Run a security audit to see results here.</p>
          <Button onClick={runAudit} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Security Audit"}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {results.map((result) => (
          <Card
            key={result.id}
            className={
              result.status === "fail" ? "border-red-200" : result.status === "warning" ? "border-amber-200" : ""
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(result.category)}
                  <CardTitle className="text-base">{result.name}</CardTitle>
                </div>
                {getStatusBadge(result.status)}
              </div>
              <CardDescription>{result.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2 text-sm">
              <p>{result.details}</p>
              {result.recommendation && (
                <Alert className="mt-2">
                  <AlertTitle>Recommendation</AlertTitle>
                  <AlertDescription>{result.recommendation}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-xs text-muted-foreground">Category: {result.category}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Security Audit</h1>
          <p className="text-muted-foreground">Analyze your application for security vulnerabilities</p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Detailed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {renderResults()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
