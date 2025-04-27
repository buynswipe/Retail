"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
  })

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Simple query to test connection
        const { data, error } = await supabase.from("users").select("count").limit(1)

        if (error) {
          setStatus("error")
          setError(error.message)
        } else {
          setStatus("success")
        }
      } catch (err) {
        setStatus("error")
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded">
            <div className="grid grid-cols-2 gap-2">
              <div>NEXT_PUBLIC_SUPABASE_URL:</div>
              <div className={envVars.url === "Set" ? "text-green-600" : "text-red-600"}>{envVars.url}</div>

              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY:</div>
              <div className={envVars.key === "Set" ? "text-green-600" : "text-red-600"}>{envVars.key}</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            {status === "loading" && <div className="text-blue-600">Testing connection...</div>}

            {status === "success" && <div className="text-green-600">Connection successful!</div>}

            {status === "error" && (
              <div>
                <div className="text-red-600 font-semibold">Connection failed</div>
                {error && <div className="mt-2 text-red-500">{error}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Again
          </button>
        </div>
      </div>
    </div>
  )
}
