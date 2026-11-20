import { useState } from "react"
import type { AdminListing, AdminListingStatus } from "@/dashboard/lib/api"
import {
  useAdminListings,
  useCancelAdminListing,
  useUpdateAdminListingStatus,
} from "@/dashboard/hooks/use-admin-listings"
import { AdminListingsTable } from "@/dashboard/components/dashboard/admin-listings-table"
import { AdminListingDetailsDialog } from "@/dashboard/components/dashboard/admin-listing-details-dialog"
import { Button } from "@/dashboard/components/ui/button"

const PAGE_SIZE = 10

type StatusFilter = "all" | AdminListingStatus

export default function AdminListings() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<StatusFilter>("all")
  const [selectedListing, setSelectedListing] =
      useState<AdminListing | null>(null)

  const query = useAdminListings({
    page,
    limit: PAGE_SIZE,
    ...(status === "all" ? {} : { status }),
  })

  const updateStatus = useUpdateAdminListingStatus()
  const cancel = useCancelAdminListing()

  const cancelAuction = (listing: AdminListing) => {
    if (!window.confirm(`Cancel the auction for "${listing.title}"? Nobody will be able to bid on it. This can't be undone.`)) {
      return
    }
    cancel.mutate(listing.id)
  }

  const changeStatus = (
      listing: AdminListing,
      nextStatus: AdminListingStatus
  ) => {
    const action =
        nextStatus === "verified"
            ? "verify"
            : nextStatus === "rejected"
                ? "reject (the club can fix it and submit it again)"
                : "move back to pending"

    if (!window.confirm(`Are you sure you want to ${action} "${listing.title}"?`)) {
      return
    }

    updateStatus.mutate({ id: listing.id, status: nextStatus })
  }

  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const changeFilter = (nextStatus: StatusFilter) => {
    setStatus(nextStatus)
    setPage(1)
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
          <p className="text-sm text-muted-foreground">
            Review listings and manage their verification status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
              size="sm"
              variant={status === "all" ? "default" : "outline"}
              onClick={() => changeFilter("all")}
          >
            All
          </Button>
          <Button
              size="sm"
              variant={status === "pending_verification" ? "default" : "outline"}
              onClick={() => changeFilter("pending_verification")}
          >
            Pending verification
          </Button>
          <Button
              size="sm"
              variant={status === "verified" ? "default" : "outline"}
              onClick={() => changeFilter("verified")}
          >
            Verified
          </Button>
          <Button
              size="sm"
              variant={status === "rejected" ? "default" : "outline"}
              onClick={() => changeFilter("rejected")}
          >
            Rejected
          </Button>
        </div>

        {query.isLoading ? (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
              Loading listings...
            </div>
        ) : query.isError ? (
            <div className="rounded-xl border p-8 text-center">
              <p className="mb-3 text-sm text-destructive">
                Could not load listings. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
        ) : (
            <>
              <AdminListingsTable
                  data={query.data?.items ?? []}
                  busyId={
                    updateStatus.isPending
                        ? (updateStatus.variables?.id ?? null)
                        : cancel.isPending
                            ? (cancel.variables ?? null)
                            : null
                  }
                  onChangeStatus={changeStatus}
                  onCancel={cancelAuction}
                  onView={(listing) => setSelectedListing(listing)}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {total === 0
                      ? "No listings"
                      : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                          page * PAGE_SIZE,
                          total
                      )} of ${total}`}
                </p>
                <div className="flex gap-2">
                  <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || query.isFetching}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || query.isFetching}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
        )}

        {updateStatus.isError && (
            <p className="text-sm text-destructive">
              Could not update the listing status. Please try again.
            </p>
        )}

        {cancel.isError && (
            <p className="text-sm text-destructive">
              Could not cancel the auction. Please try again.
            </p>
        )}

        <AdminListingDetailsDialog
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
        />
      </div>
  )
}
