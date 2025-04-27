"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export default function ConfigurationGuidePage() {
  const [activeTab, setActiveTab] = useState("environment")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Configuration Guide</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <TabsTrigger value="environment">Environment Setup</TabsTrigger>
          <TabsTrigger value="database">Database Configuration</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Configure the necessary environment variables for your Retail Bandhu application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Store these variables securely. Never commit them to version control.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Required Variables</h3>
                  <div className="bg-muted p-4 rounded-md relative">
                    <pre className="text-sm whitespace-pre-wrap">
                      <code>
                        {`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Optional: UPI Payment Configuration
PHONEPE_MERCHANT_ID=your-phonepe-merchant-id
PHONEPE_SALT_KEY=your-phonepe-salt-key
PHONEPE_SALT_INDEX=your-phonepe-salt-index`}
                      </code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Optional: UPI Payment Configuration
PHONEPE_MERCHANT_ID=your-phonepe-merchant-id
PHONEPE_SALT_KEY=your-phonepe-salt-key
PHONEPE_SALT_INDEX=your-phonepe-salt-index`)
                      }
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Setting Up Environment Variables</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Create a <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file in the root of your
                      project
                    </li>
                    <li>Copy the variables above and replace with your actual values</li>
                    <li>For production, add these variables to your hosting platform (e.g., Vercel)</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>Set up and configure your Supabase database for Retail Bandhu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Database Schema Setup</h3>
                  <p className="mb-4">
                    Run the following SQL scripts in your Supabase SQL editor to set up the required tables and
                    functions:
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Run <code className="bg-muted px-1 py-0.5 rounded">create-tables.sql</code> to create all required
                      tables
                    </li>
                    <li>
                      Run <code className="bg-muted px-1 py-0.5 rounded">create-functions.sql</code> to create database
                      functions
                    </li>
                    <li>
                      Run <code className="bg-muted px-1 py-0.5 rounded">create-triggers.sql</code> to set up database
                      triggers
                    </li>
                    <li>
                      Run <code className="bg-muted px-1 py-0.5 rounded">enable-rls.sql</code> to configure Row Level
                      Security
                    </li>
                    <li>
                      Run <code className="bg-muted px-1 py-0.5 rounded">create-policies.sql</code> to set up access
                      policies
                    </li>
                  </ol>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Tip</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Use the <code className="bg-green-100 px-1 py-0.5 rounded">supabase-schema.sql</code> file for a
                    complete database setup in one go.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="text-lg font-medium mb-2">Database Migrations</h3>
                  <p>
                    For production environments, it's recommended to use proper database migrations. You can use the
                    Supabase CLI to manage migrations:
                  </p>
                  <div className="bg-muted p-4 rounded-md mt-2">
                    <pre className="text-sm">
                      <code>
                        {`# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Create a new migration
supabase migration new create_initial_schema

# Apply migrations
supabase db push`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Setup</CardTitle>
              <CardDescription>Configure authentication for your Retail Bandhu application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Supabase Auth Configuration</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to Authentication &gt; Settings</li>
                    <li>Enable Phone Auth provider</li>
                    <li>Add your site URL to the Site URL field</li>
                    <li>Add your production domain to the Additional Redirect URLs</li>
                  </ol>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    For production, you'll need to set up a proper SMS provider in the Supabase dashboard to send OTP
                    messages.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="text-lg font-medium mb-2">User Management</h3>
                  <p className="mb-2">The application uses a custom user management system with the following roles:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Admin: Full access to all features</li>
                    <li>Retailer: Access to retailer-specific features</li>
                    <li>Wholesaler: Access to wholesaler-specific features</li>
                    <li>Delivery: Access to delivery partner features</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer">
                      Supabase Auth Documentation
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Guide</CardTitle>
              <CardDescription>Deploy your Retail Bandhu application to production.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Deployment with Vercel</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Push your code to a Git repository (GitHub, GitLab, or Bitbucket)</li>
                    <li>Create a new project on Vercel and connect your repository</li>
                    <li>Configure your environment variables in the Vercel dashboard</li>
                    <li>Deploy your application</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Pre-Deployment Checklist</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <ul className="list-disc list-inside space-y-1">
                      <li>All environment variables are configured</li>
                      <li>Database schema is properly set up</li>
                      <li>Authentication providers are configured</li>
                      <li>Payment gateway integration is tested</li>
                      <li>Row Level Security policies are in place</li>
                      <li>Performance optimizations are applied</li>
                      <li>Error tracking is configured</li>
                    </ul>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Continuous Deployment</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Set up GitHub Actions or Vercel's built-in CI/CD to automatically deploy changes when you push to
                    your main branch.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a
                      href="https://vercel.com/docs/concepts/deployments/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vercel Deployment Documentation
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
