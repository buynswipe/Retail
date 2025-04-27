"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [envVars, setEnvVars] = useState({
    url: "",
    keyLength: 0,
  })

  useEffect(() => {
    async function testConnection() {
      try {
        // Check environment variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        setEnvVars({
          url: url,
          keyLength: key.length,
        })

        if (!url || !key) {
          setStatus("error")
          setMessage("Missing Supabase URL or key in environment variables")
          return
        }

        // Test connection with a simple query
        const { data, error } = await supabase.from("users").select("count").limit(1)

        if (error) {
          setStatus("error")
          setMessage(`Supabase query error: ${error.message}`)
          return
        }

        setStatus("success")
        setMessage("Successfully connected to Supabase!")
      } catch (err) {
        setStatus("error")
        setMessage(`Exception: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div
          className={`p-4 ${status === "loading" ? "bg-blue-500" : status === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          <h1 className="text-xl font-bold text-white">Supabase Connection Test</h1>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Environment Variables</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="mb-2">
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
                {envVars.url ? (
                  <span className="text-green-600">{envVars.url}</span>
                ) : (
                  <span className="text-red-600">Not set</span>
                )}
              </div>
              <div>
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{" "}
                {envVars.keyLength > 0 ? (
                  <span className="text-green-600">{`Set (${envVars.keyLength} characters)`}</span>
                ) : (
                  <span className="text-red-600">Not set</span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Connection Status</h2>
            <div
              className={`p-4 rounded-md ${
                status === "loading"
                  ? "bg-blue-50 text-blue-700"
                  : status === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {status === "loading" ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Testing connection...
                </div>
              ) : (
                message
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Return to Home
            </a>
            <a href="/diagnostics" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View Full Diagnostics
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
