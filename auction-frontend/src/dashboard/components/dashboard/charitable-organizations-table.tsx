import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { HeartHandshake, Pencil, Trash2 } from "lucide-react"
import type { CharitableOrganization } from "@/dashboard/lib/api"
import { flagEmoji } from "@/lib/utils"
import { COUNTRIES } from "@/lib/countries"
import { Badge } from "@/dashboard/components/ui/badge"
import { Button } from "@/dashboard/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/dashboard/components/ui/table"

const countryNames = new Map(COUNTRIES.map((country) => [country.code, country.name]))

/**
 * Administrative data table component for displaying charitable organizations.
 * Renders each organization's logo, name, description, and row-level edit or delete actions.
 * Built with TanStack Table to match the dashboard's standard table layout.
 */

interface CharitableOrganizationsTableProps {
  data: CharitableOrganization[]
  onEdit: (organization: CharitableOrganization) => void
  onDelete: (organization: CharitableOrganization) => void
}

export function CharitableOrganizationsTable({
  data,
  onEdit,
  onDelete,
}: CharitableOrganizationsTableProps) {
  const columns = useMemo<ColumnDef<CharitableOrganization>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => {
          const org = row.original
          return (
            <div className="flex items-center gap-3">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-8 rounded-md border object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                  <HeartHandshake className="size-4" />
                </div>
              )}
              <span className="font-medium">{org.name}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="max-w-md truncate text-sm text-muted-foreground">
            {row.original.description || "—"}
          </p>
        ),
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }) => {
          const code = row.original.country
          return (
            <span className="text-sm">
              {code ? `${flagEmoji(code)} ${countryNames.get(code) ?? code}` : "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "verified",
        header: "Verified",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.verified
                ? "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                : "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400"
            }
          >
            {row.original.verified ? "Verified" : "Pending"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit charitable organization"
              onClick={() => onEdit(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Deactivate charitable organization"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
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
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No charitable organizations found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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