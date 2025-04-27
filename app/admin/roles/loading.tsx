import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCog } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">User Role Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-muted-foreground" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[200px]" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center mt-4">
            <Skeleton className="h-10 w-[300px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
