import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentStatusLoading() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Processing Payment</CardTitle>
          <CardDescription className="text-center">Please wait while we verify your payment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="mt-4 text-center">Verifying payment status...</p>
        </CardContent>
      </Card>
    </div>
  )
}
