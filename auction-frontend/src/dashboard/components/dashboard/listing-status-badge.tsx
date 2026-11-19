import type { ListingStatus } from "@/dashboard/lib/club-api"
import { Badge } from "@/dashboard/components/ui/badge.tsx"

const styles: Record<ListingStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300",
  },
  pending_verification: {
    label: "Pending verification",
    className: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  verified: {
    label: "Verified",
    className: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const { label, className } = styles[status]
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
