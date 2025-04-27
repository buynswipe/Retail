"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function EnvCheckPage() {
  const [serverData, setServerData] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkEnvironment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check server-side environment variables
      const response = await fetch("/api/env-check")
      const data = await response.json()
      setServerData(data)

      // Check client-side environment variables
      setClientData({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0} chars)`
          : "❌ Missing",
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check environment")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Environment Variable Check</h1>
          <p className="mt-2 text-gray-600">Diagnose issues with environment variables</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-900">Environment Variables Status</h2>
            <button
              onClick={checkEnvironment}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {error ? (
            <div className="p-6 bg-red-50">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-red-800">Error</h3>
              </div>
              <div className="mt-2 text-red-700">{error}</div>
            </div>
          ) : loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">Checking environment variables...</p>
            </div>
          ) : (
            <div>
              {/* Client-side environment variables */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Client-Side Environment Variables</h3>
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="text-sm text-yellow-700">
                      Only variables prefixed with NEXT_PUBLIC_ are available on the client side.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {clientData &&
                    Object.entries(clientData)
                      .filter(([key]) => key !== "timestamp")
                      .map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="font-mono text-sm text-gray-600">{key}</span>
                          <span
                            className={
                              value.includes("✅")
                                ? "text-green-600 flex items-center"
                                : "text-red-600 flex items-center"
                            }
                          >
                            {value.includes("✅") ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            {value}
                          </span>
                        </div>
                      ))}
                </div>
              </div>

              {/* Server-side environment variables */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Server-Side Environment Variables</h3>
                <div className="space-y-3">
                  {serverData &&
                    Object.entries(serverData.variables).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-600">{key}</span>
                        <span
                          className={
                            value.includes("✅") ? "text-green-600 flex items-center" : "text-red-600 flex items-center"
                          }
                        >
                          {value.includes("✅") ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Runtime information */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Runtime Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Server Environment:</span>
                    <span className="ml-2">{serverData?.environment}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Vercel Environment:</span>
                    <span className="ml-2">{serverData?.variables.VERCEL_ENV}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Server Timestamp:</span>
                    <span className="ml-2">{new Date(serverData?.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Client Timestamp:</span>
                    <span className="ml-2">{clientData && new Date(clientData.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Troubleshooting Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>
                Verify that <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set
                correctly.
              </li>
              <li>Make sure the environment variables are available in the production environment.</li>
              <li>Check that the Supabase client is using the correct variable names.</li>
              <li>Redeploy the application after confirming environment variables are set.</li>
              <li>Clear browser cache and cookies, then try again.</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  )
}
