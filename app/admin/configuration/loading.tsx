import { Skeleton } from "@/components/ui/skeleton"

export default function ConfigurationGuideLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Skeleton className="h-10 w-64 mb-8" />

      <div className="space-y-4">{/* Add your configuration guide content here */}</div>
    </div>
  )
}
