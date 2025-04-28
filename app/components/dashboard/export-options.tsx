"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, FileImage } from "lucide-react"
import { exportToCSV, exportToPDF } from "@/lib/analytics-utils"

interface ExportOptionsProps {
  data: any[]
  columns: { key: string; title: string }[]
  filename: string
  title: string
}

export function ExportOptions({ data, columns, filename, title }: ExportOptionsProps) {
  const handleExportCSV = () => {
    exportToCSV(data, filename)
  }

  const handleExportPDF = () => {
    exportToPDF(data, columns, title, filename)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileImage className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
