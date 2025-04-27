import { Badge } from "@/components/ui/badge"
import type { ServiceStatus } from "@/lib/status-service"

interface StatusBadgeProps {
  status: ServiceStatus
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  }

  const statusConfig = {
    operational: {
      variant: "outline" as const,
      className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
      label: "Operational",
    },
    degraded: {
      variant: "outline" as const,
      className: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100",
      label: "Degraded",
    },
    outage: {
      variant: "outline" as const,
      className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-100",
      label: "Outage",
    },
    maintenance: {
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
      label: "Maintenance",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={`${config.className} ${sizeClasses[size]} font-medium`}>
      {config.label}
    </Badge>
  )
}
