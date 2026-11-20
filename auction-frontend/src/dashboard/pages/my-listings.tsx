import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useMyClub } from "@/dashboard/hooks/use-club"
import { useCancelMyListing, useMyListings, useSubmitMyListing } from "@/dashboard/hooks/use-my-listings"
import { getClubErrorMessage } from "@/dashboard/lib/club-errors"
import { CLUB_APPROVED, LISTING_STATUSES, type ListingStatus, type MyListing } from "@/dashboard/lib/club-api"
import { MyListingsTable } from "@/dashboard/components/dashboard/my-listings-table"
import { ListingFormDialog } from "@/dashboard/components/dashboard/listing-form-dialog"
import { DeleteListingDialog } from "@/dashboard/components/dashboard/delete-listing-dialog"
import { selectClass } from "@/dashboard/components/dashboard/field"
import { Button } from "@/components/ui/button"

/**
 * The club's own listings: list with status filter and pagination, plus add, edit, delete and
 * "submit for verification". The server only returns this club's listings. Until an admin approves
 * the club, the page explains that instead of showing the listings.
 */

const PAGE_SIZE = 10

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending_verification: "Pending verification",
  verified: "Verified",
  rejected: "Rejected",
}

export default function MyListings() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ListingStatus | "">("")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MyListing | null>(null)
  const [deleting, setDeleting] = useState<MyListing | null>(null)
  const [actionError, setActionError] = useState("")

  const club = useMyClub()
  const approved = club.data?.status === CLUB_APPROVED

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useMyListings(
    { page, limit: PAGE_SIZE, status: status || undefined },
    approved
  )
  const submit = useSubmitMyListing()
  const cancel = useCancelMyListing()

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  // If you delete the last listing on the last page, go back one page
  useEffect(() => {
    if (data && page > 1 && data.items.length === 0) setPage((p) => p - 1)
  }, [data, page])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(listing: MyListing) {
    setEditing(listing)
    setFormOpen(true)
  }

  function handleSubmit(listing: MyListing) {
    const ok = window.confirm(
      `Submit “${listing.title}” for verification? You can't edit it while it is being reviewed.`
    )
    if (!ok) return
    setActionError("")
    submit.mutate(listing.id, {
      onError: (e) => setActionError(getClubErrorMessage(e, "Couldn’t submit the listing. Try again.")),
    })
  }

  function handleCancel(listing: MyListing) {
    const ok = window.confirm(`Cancel the auction for “${listing.title}”? This can't be undone.`)
    if (!ok) return
    setActionError("")
    cancel.mutate(listing.id, {
      onError: (e) => setActionError(getClubErrorMessage(e, "Couldn’t cancel the auction. Try again.")),
    })
  }

  if (club.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (club.isError) {
    return (
      <div className="rounded-xl border border-destructive/40 p-4 text-sm">
        <p className="font-medium">Couldn’t load your club</p>
        <p className="text-muted-foreground">{getClubErrorMessage(club.error)}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => club.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
        <div className="rounded-xl border bg-card p-6 text-sm">
          <p className="font-medium">Your club is waiting for approval</p>
          <p className="mt-1 text-muted-foreground">
            You can add and manage listings once an administrator approves {club.data.name}. In the meantime you can
            complete your club profile.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/dashboard/club">Go to club profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
        <Button onClick={openCreate}>
          <Plus /> Add listing
        </Button>
      </div>

      <div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ListingStatus | "")
            setPage(1)
          }}
          aria-label="Filter by status"
          className={`${selectClass} sm:w-56`}
        >
          <option value="">All statuses</option>
          {LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {isPending && <p className="text-sm text-muted-foreground">Loading listings…</p>}

      {isError && (
        <div className="rounded-xl border border-destructive/40 p-4 text-sm">
          <p className="font-medium">Couldn’t load your listings</p>
          <p className="text-muted-foreground">{getClubErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <MyListingsTable
            data={data.items}
            busyId={submit.isPending ? (submit.variables ?? null) : cancel.isPending ? (cancel.variables ?? null) : null}
            onEdit={openEdit}
            onDelete={setDeleting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {from}–{to} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isPlaceholderData}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      )}

      <ListingFormDialog open={formOpen} onOpenChange={setFormOpen} listing={editing} />
      <DeleteListingDialog listing={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  )
}
