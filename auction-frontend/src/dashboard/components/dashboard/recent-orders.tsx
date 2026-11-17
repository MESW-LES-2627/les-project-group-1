import { Badge } from "@/dashboard/components/ui/badge.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/dashboard/components/ui/card.tsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/dashboard/components/ui/table.tsx"

const orders = [
  { id: "#1042", customer: "Olivia Martin", status: "Paid", amount: "$250.00" },
  { id: "#1041", customer: "Jackson Lee", status: "Pending", amount: "$120.00" },
  { id: "#1040", customer: "Isabella Nguyen", status: "Paid", amount: "$340.00" },
  { id: "#1039", customer: "William Kim", status: "Failed", amount: "$89.00" },
  { id: "#1038", customer: "Sofia Davis", status: "Paid", amount: "$410.00" },
]

const variant = { Paid: "default", Pending: "secondary", Failed: "destructive" } as const

export function RecentOrders() {
  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest five, sample data</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <div className="font-medium">{o.customer}</div>
                  <div className="text-xs text-muted-foreground">{o.id}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={variant[o.status as keyof typeof variant]}>{o.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{o.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
