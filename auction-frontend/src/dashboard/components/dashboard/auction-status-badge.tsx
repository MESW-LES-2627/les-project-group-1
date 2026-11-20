import type { AuctionStatus } from "@/dashboard/lib/club-api"
import { Badge } from "@/dashboard/components/ui/badge.tsx"

const styles: Record<AuctionStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  active: {
    label: "Active",
    className: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  completed: {
    label: "Completed",
    className: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
}

/** The auction status. Listings that aren't verified have no auction yet, shown as a dash. */
export function AuctionStatusBadge({ status }: { status: AuctionStatus | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  const { label, className } = styles[status]
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
