"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, XCircle, RefreshCw, Database, Key } from "lucide-react"
import Link from "next/link"

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/diagnostics/supabase")

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setDiagnosticData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run diagnostics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
          <p className="mt-2 text-gray-600">Check the status of your Supabase connection and configuration</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-900">Supabase Connection Status</h2>
            <button
              onClick={runDiagnostics}
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
            <div className="p-6 bg-red-50 border-b border-red-200">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-red-800">Diagnostic Error</h3>
              </div>
              <div className="mt-2 text-red-700">{error}</div>
            </div>
          ) : loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">Running diagnostics...</p>
            </div>
          ) : diagnosticData ? (
            <div className="divide-y divide-gray-200">
              {/* Environment Variables */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Key className="h-5 w-5 mr-2 text-gray-500" />
                  Environment Variables
                </h3>
                <div className="space-y-3">
                  {Object.entries(diagnosticData.environmentVariables).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-600">{key}</span>
                      <span className={value.includes("✅") ? "text-green-600" : "text-red-600"}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supabase Connection */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2 text-gray-500" />
                  Supabase Connection
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Connection Status:</span>
                    <span
                      className={
                        diagnosticData.supabaseConnection.status.includes("✅") ? "text-green-600" : "text-red-600"
                      }
                    >
                      {diagnosticData.supabaseConnection.status}
                    </span>
                  </div>

                  {diagnosticData.supabaseConnection.error && (
                    <div className="bg-red-50 p-4 rounded-md">
                      <div className="flex">
                        <XCircle className="h-5 w-5 text-red-400 mr-2" />
                        <h4 className="text-sm font-medium text-red-800">Error Message:</h4>
                      </div>
                      <div className="mt-2 text-sm text-red-700 font-mono overflow-auto">
                        {diagnosticData.supabaseConnection.error}
                      </div>
                    </div>
                  )}

                  {diagnosticData.supabaseConnection.tables && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tables:</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 font-mono">
                          {diagnosticData.supabaseConnection.tables.map((table: string) => (
                            <li key={table}>{table}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Info */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Environment:</span>
                    <span className="ml-2">{diagnosticData.environment}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Timestamp:</span>
                    <span className="ml-2">{new Date(diagnosticData.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between">
              <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Return to Home
              </Link>
              {diagnosticData?.supabaseConnection.status.includes("❌") && (
                <a
                  href="https://supabase.com/docs/guides/api/connecting-to-supabase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View Supabase Documentation
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
