import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import type { ServiceHealthCheck } from "@/lib/status-service"

interface ServiceStatusCardProps {
  service: ServiceHealthCheck
}

export function ServiceStatusCard({ service }: ServiceStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <StatusBadge status={service.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Response Time:</span>
            <span className="font-medium">{service.responseTime ? `${service.responseTime}ms` : "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Checked:</span>
            <span className="font-medium">{service.lastChecked.toLocaleTimeString()}</span>
          </div>
          {service.message && <div className="mt-2 text-sm text-red-600">{service.message}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
