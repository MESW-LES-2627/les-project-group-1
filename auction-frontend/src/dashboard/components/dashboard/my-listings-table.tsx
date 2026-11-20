import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Ban, Pencil, Send, Trash2 } from "lucide-react"
import { assetUrl } from "@/lib/assets"
import { isEditable } from "@/dashboard/lib/listing-form"
import type { MyListing } from "@/dashboard/lib/club-api"
import { Button } from "@/dashboard/components/ui/button.tsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/dashboard/components/ui/table.tsx"
import { ListingStatusBadge } from "@/dashboard/components/dashboard/listing-status-badge"
import { AuctionStatusBadge } from "@/dashboard/components/dashboard/auction-status-badge"

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" })

interface MyListingsTableProps {
  data: MyListing[]
  busyId: number | null // the listing being submitted right now
  onEdit: (listing: MyListing) => void
  onDelete: (listing: MyListing) => void
  onSubmit: (listing: MyListing) => void
  onCancel: (listing: MyListing) => void
}

const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—")

export function MyListingsTable({ data, busyId, onEdit, onDelete, onSubmit, onCancel }: MyListingsTableProps) {
  const columns = useMemo<ColumnDef<MyListing>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Listing",
        cell: ({ row }) => {
          const listing = row.original
          const cover = assetUrl(listing.images[0])
          return (
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                {cover && <img src={cover} alt="" className="size-full object-cover" />}
              </div>
              <div>
                <div className="font-medium">{listing.title}</div>
                <div className="text-xs text-muted-foreground">{listing.category.name}</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ListingStatusBadge status={row.original.status} />,
      },
      {
        id: "auction",
        header: "Auction",
        cell: ({ row }) => <AuctionStatusBadge status={row.original.auctionStatus} />,
      },
      {
        id: "charity",
        header: "Charity",
        cell: ({ row }) => {
          const charity = row.original.charitableOrganization
          if (!charity) return "—"
          const donation = row.original.donationPercentage
          return (
            <span className="text-sm">
              {charity.name}
              {donation !== null ? ` · ${donation}%` : ""}
            </span>
          )
        },
      },
      {
        accessorKey: "startingPrice",
        header: "Starting price",
        cell: ({ row }) => (row.original.startingPrice === null ? "—" : euro.format(row.original.startingPrice)),
      },
      {
        id: "dates",
        header: "Auction dates",
        cell: ({ row }) => (
          <div className="text-xs">
            <div>
              <span className="text-muted-foreground">Starts </span>
              {row.original.auctionStartsAt ? dateTime(row.original.auctionStartsAt) : "when verified"}
            </div>
            <div>
              <span className="text-muted-foreground">Ends </span>
              {dateTime(row.original.auctionEndsAt)}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const listing = row.original
          return (
            <div className="flex justify-end gap-1">
              {listing.canCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancel auction"
                  title="Cancel auction"
                  disabled={busyId === listing.id}
                  onClick={() => onCancel(listing)}
                >
                  <Ban />
                </Button>
              )}
              {isEditable(listing.status) && !listing.cancelledAt && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Submit for verification"
                    title="Submit for verification"
                    disabled={busyId === listing.id}
                    onClick={() => onSubmit(listing)}
                  >
                    <Send />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Edit listing" onClick={() => onEdit(listing)}>
                    <Pencil />
                  </Button>
                </>
              )}
              {listing.status !== "verified" && (
                <Button variant="ghost" size="icon" aria-label="Delete listing" onClick={() => onDelete(listing)}>
                  <Trash2 />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [busyId, onEdit, onDelete, onSubmit, onCancel]
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
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No listings yet.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
