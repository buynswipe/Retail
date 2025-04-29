"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserFlowNode {
  id: string
  label: string
  value: number
}

interface UserFlowLink {
  source: string
  target: string
  value: number
}

interface UserFlowData {
  nodes: UserFlowNode[]
  links: UserFlowLink[]
}

interface UserFlowChartProps {
  data: UserFlowData
  title?: string
  description?: string
  className?: string
}

export function UserFlowChart({ data, title = "User Flow Analysis", description, className }: UserFlowChartProps) {
  const [flowType, setFlowType] = React.useState<string>("all")
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Filter data based on selected flow type
  const filteredData = React.useMemo(() => {
    if (flowType === "all") return data

    // In a real implementation, you would filter the data based on the flow type
    // For now, we'll just return the original data
    return data
  }, [data, flowType])

  // Draw the Sankey diagram
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // In a real implementation, you would draw a Sankey diagram here
    // For now, we'll just draw a placeholder

    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = "14px sans-serif"
    ctx.fillStyle = "#6b7280"
    ctx.textAlign = "center"
    ctx.fillText("User Flow Visualization", canvas.width / 2, canvas.height / 2)
    ctx.fillText("(Sankey Diagram would be rendered here)", canvas.width / 2, canvas.height / 2 + 20)

    // Draw some nodes and links as placeholders
    const nodeHeight = 30
    const nodeWidth = 120
    const padding = 50
    const columnWidth = (canvas.width - padding * 2) / 3

    // Draw nodes
    filteredData.nodes.forEach((node, index) => {
      const column = Math.floor(index / 3)
      const row = index % 3

      const x = padding + column * columnWidth
      const y = padding + row * (nodeHeight + 20)

      ctx.fillStyle = "#e5e7eb"
      ctx.fillRect(x, y, nodeWidth, nodeHeight)

      ctx.fillStyle = "#374151"
      ctx.textAlign = "center"
      ctx.fillText(node.label, x + nodeWidth / 2, y + nodeHeight / 2 + 5)
    })

    // Draw links
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 2

    filteredData.links.forEach((link) => {
      const sourceIndex = filteredData.nodes.findIndex((node) => node.id === link.source)
      const targetIndex = filteredData.nodes.findIndex((node) => node.id === link.target)

      if (sourceIndex === -1 || targetIndex === -1) return

      const sourceColumn = Math.floor(sourceIndex / 3)
      const sourceRow = sourceIndex % 3
      const targetColumn = Math.floor(targetIndex / 3)
      const targetRow = targetIndex % 3

      const sourceX = padding + sourceColumn * columnWidth + nodeWidth
      const sourceY = padding + sourceRow * (nodeHeight + 20) + nodeHeight / 2
      const targetX = padding + targetColumn * columnWidth
      const targetY = padding + targetRow * (nodeHeight + 20) + nodeHeight / 2

      ctx.beginPath()
      ctx.moveTo(sourceX, sourceY)

      // Draw a curved line
      const controlX = (sourceX + targetX) / 2
      ctx.bezierCurveTo(controlX, sourceY, controlX, targetY, targetX, targetY)

      ctx.stroke()
    })
  }, [filteredData])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Select value={flowType} onValueChange={setFlowType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select flow type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flows</SelectItem>
              <SelectItem value="signup">Signup Flow</SelectItem>
              <SelectItem value="purchase">Purchase Flow</SelectItem>
              <SelectItem value="browse">Browse Flow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] relative">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}
