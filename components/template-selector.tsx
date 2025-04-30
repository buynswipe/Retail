"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Printer, Check } from "lucide-react"
import { InvoicePreview } from "./invoice-preview"
import { toast } from "@/hooks/use-toast"

interface TemplateSelectorProps {
  defaultTemplate: "standard" | "detailed"
  onTemplateChange: (template: "standard" | "detailed") => void
}

export function TemplateSelector({ defaultTemplate, onTemplateChange }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<"standard" | "detailed">(defaultTemplate)
  const [previewType, setPreviewType] = useState<"standard" | "detailed" | null>(null)

  const handleTemplateChange = (value: "standard" | "detailed") => {
    setSelectedTemplate(value)
    onTemplateChange(value)
    toast({
      title: "Default Template Changed",
      description: `${value === "standard" ? "Standard GST Invoice" : "Detailed Tax Invoice"} set as default template.`,
    })
  }

  const handleOpenPreview = (type: "standard" | "detailed") => {
    setPreviewType(type)
  }

  const handleClosePreview = () => {
    setPreviewType(null)
  }

  const handleSelectTemplate = (type: "standard" | "detailed") => {
    handleTemplateChange(type)
    handleClosePreview()
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedTemplate} onValueChange={handleTemplateChange as (value: string) => void}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={`border-2 ${selectedTemplate === "standard" ? "border-blue-500" : "border-gray-200"}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <RadioGroupItem value="standard" id="standard" className="mt-1" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label htmlFor="standard" className="font-semibold text-base">
                        Standard GST Invoice
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">Default template for all orders</p>
                    </div>
                    {selectedTemplate === "standard" && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Default
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => handleOpenPreview("standard")}>
                    <Printer className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${selectedTemplate === "detailed" ? "border-blue-500" : "border-gray-200"}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <RadioGroupItem value="detailed" id="detailed" className="mt-1" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label htmlFor="detailed" className="font-semibold text-base">
                        Detailed Tax Invoice
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">With HSN codes and tax breakup</p>
                    </div>
                    {selectedTemplate === "detailed" && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Default
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => handleOpenPreview("detailed")}>
                    <Printer className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RadioGroup>

      {/* Invoice Preview Dialog */}
      {previewType && (
        <InvoicePreview
          type={previewType}
          isOpen={previewType !== null}
          onClose={handleClosePreview}
          onSelect={handleSelectTemplate}
          isDefault={previewType === selectedTemplate}
        />
      )}
    </div>
  )
}
