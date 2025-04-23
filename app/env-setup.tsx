"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EnvSetupDialog() {
  const [open, setOpen] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")

  useEffect(() => {
    // Check if environment variables are missing
    const isMissingEnvVars =
      !window.localStorage.getItem("NEXT_PUBLIC_SUPABASE_URL") ||
      !window.localStorage.getItem("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    // Only show the dialog if environment variables are missing
    if (isMissingEnvVars) {
      setOpen(true)
    }
  }, [])

  const handleSave = () => {
    // Store values in localStorage for development purposes
    if (supabaseUrl) {
      window.localStorage.setItem("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
    }
    if (supabaseKey) {
      window.localStorage.setItem("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseKey)
    }

    setOpen(false)

    // Reload the page to apply the new environment variables
    window.location.reload()
  }

  const handleSkip = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Setup Environment Variables</DialogTitle>
          <DialogDescription>
            For full functionality, please provide your Supabase credentials. You can skip this step to use mock data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
            <Input
              id="supabaseKey"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="your-anon-key"
              type="password"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            Skip (Use Mock Data)
          </Button>
          <Button onClick={handleSave}>Save and Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
