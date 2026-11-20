
import { useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Ban, Check, RotateCcw, Eye, X } from "lucide-react"
import { assetUrl } from "@/lib/assets"
import type {
  AdminListing,
  AdminListingStatus,
} from "@/dashboard/lib/api"
import { Button } from "@/dashboard/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/dashboard/components/ui/table"
import { ListingStatusBadge } from "@/dashboard/components/dashboard/listing-status-badge"
import { AuctionStatusBadge } from "@/dashboard/components/dashboard/auction-status-badge"

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
})

interface Props {
  data: AdminListing[]
  busyId: number | null
  onChangeStatus: (
      listing: AdminListing,
      status: AdminListingStatus
  ) => void
  onView: (listing: AdminListing) => void
  onCancel: (listing: AdminListing) => void
}

export function AdminListingsTable({
                                     data,
                                     busyId,
                                     onChangeStatus,
                                     onView,
                                     onCancel,
                                   }: Props) {
  const columns = useMemo<ColumnDef<AdminListing>[]>(
      () => [
        {
          accessorKey: "title",
          header: "Listing",
          cell: ({ row }) => {
            const listing = row.original
            const cover = listing.images?.[0]
                ? assetUrl(listing.images[0])
                : null

            return (
                <div className="flex min-w-52 items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {cover && (
                        <img
                            src={cover}
                            alt=""
                            className="size-full object-cover"
                        />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.category?.name ?? "Uncategorised"}
                    </p>
                  </div>
                </div>
            )
          },
        },
        {
          accessorKey: "playerName",
          header: "Player",
          cell: ({ row }) => row.original.playerName || "—",
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
              <ListingStatusBadge status={row.original.status} />
          ),
        },
        {
          id: "auction",
          header: "Auction",
          cell: ({ row }) => (
              <div className="space-y-1">
                <AuctionStatusBadge status={row.original.auctionStatus} />
                {row.original.auctionStatus === "scheduled" && row.original.auctionStartsAt && (
                    <p className="text-xs text-muted-foreground">
                      Opens {new Date(row.original.auctionStartsAt).toLocaleString()}
                    </p>
                )}
              </div>
          ),
        },
        {
          accessorKey: "startingPrice",
          header: "Starting price",
          cell: ({ row }) =>
              row.original.startingPrice == null
                  ? "—"
                  : euro.format(row.original.startingPrice),
        },
        {
          accessorKey: "createdAt",
          header: "Created",
          cell: ({ row }) =>
              new Date(row.original.createdAt).toLocaleDateString(),
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => {
            const listing = row.original
            const busy = busyId === listing.id

            return (
                <div className="flex justify-end gap-2">
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(listing)}
                  >
                    <Eye /> View
                  </Button>

                  {listing.canCancel && (
                      <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => onCancel(listing)}
                      >
                        <Ban /> Cancel
                      </Button>
                  )}

                  {/* Under review: verify, or reject so the club can fix it and submit it again */}
                  {!listing.cancelledAt && listing.status === "pending_verification" && (
                      <>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => onChangeStatus(listing, "rejected")}
                        >
                          <X /> Reject
                        </Button>
                        <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => onChangeStatus(listing, "verified")}
                        >
                          <Check /> Verify
                        </Button>
                      </>
                  )}

                  {!listing.cancelledAt && listing.status === "verified" && (
                      <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                              onChangeStatus(listing, "pending_verification")
                          }
                      >
                        <RotateCcw /> Set pending
                      </Button>
                  )}
                </div>
            )
          },
        },
      ],
      [busyId, onChangeStatus, onView, onCancel]
  )

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                      </TableHead>
                  ))}
                </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                  >
                    No listings found.
                  </TableCell>
                </TableRow>
            ) : (
                table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                            )}
                          </TableCell>
                      ))}
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
  )
}
