import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Building2, Check, X } from "lucide-react"
import type { Club, ClubStatus } from "@/dashboard/lib/api"
import { Badge } from "@/dashboard/components/ui/badge"
import { Button } from "@/dashboard/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/dashboard/components/ui/table"

const statusStyles: Record<ClubStatus, string> = {
  approved: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  pending: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  rejected: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
}

interface ClubsTableProps {
  data: Club[]
  onChangeStatus: (club: Club, status: ClubStatus) => void
  updatingId?: number
}

export function ClubsTable({ data, onChangeStatus, updatingId }: ClubsTableProps) {
  const columns = useMemo<ColumnDef<Club>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Club",
        cell: ({ row }) => {
          const club = row.original
          return (
            <div className="flex items-center gap-3">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="size-8 rounded-md border object-contain" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                  <Building2 className="size-4" />
                </div>
              )}
              <div>
                <div className="font-medium">{club.name}</div>
                <div className="text-xs text-muted-foreground">/{club.slug}</div>
              </div>
            </div>
          )
        },
      },
      {
        id: "owner",
        header: "Owner",
        cell: ({ row }) => {
          const owner = row.original.user
          if (!owner) return <span className="text-sm text-muted-foreground">—</span>
          return (
            <div>
              <div className="text-sm font-medium">{owner.username}</div>
              <div className="text-xs text-muted-foreground">{owner.email}</div>
            </div>
          )
        },
      },
      {
        id: "listings",
        header: "Listings",
        cell: ({ row }) => <span className="text-sm">{row.original._count.listings}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={statusStyles[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const club = row.original
          const busy = updatingId === club.id
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Approve ${club.name}`}
                title="Approve"
                disabled={busy || club.status === "approved"}
                onClick={() => onChangeStatus(club, "approved")}
              >
                <Check />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Reject ${club.name}`}
                title="Reject"
                disabled={busy || club.status === "rejected"}
                onClick={() => onChangeStatus(club, "rejected")}
              >
                <X />
              </Button>
            </div>
          )
        },
      },
    ],
    [onChangeStatus, updatingId]
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
                No clubs found.
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
