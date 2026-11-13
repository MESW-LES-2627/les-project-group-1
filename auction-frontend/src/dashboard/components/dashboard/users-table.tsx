import { useMemo } from "react"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import type { User, UserRole } from "@/dashboard/lib/api.ts"
import { flagEmoji } from "@/lib/utils.ts"
import { COUNTRIES } from "@/lib/countries"
import { Badge } from "@/dashboard/components/ui/badge.tsx"
import { Button } from "@/dashboard/components/ui/button.tsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/dashboard/components/ui/table.tsx"

const roleStyles: Record<UserRole, string> = {
    ADMIN: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    CLUB: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    BUYER: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
}

const countryNames = new Map(COUNTRIES.map((c) => [c.code, c.name]))

interface UsersTableProps {
    data: User[]
    onEdit: (user: User) => void
    onDelete: (user: User) => void
}

export function UsersTable({ data, onEdit, onDelete }: UsersTableProps) {
    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: "username",
                header: "User",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.username}</div>
                        <div className="text-xs text-muted-foreground">{row.original.email}</div>
                    </div>
                ),
            },
            {
                accessorKey: "country",
                header: "Country",
                cell: ({ row }) => {
                    const code = row.original.country
                    return (<span> {flagEmoji(code)} {countryNames.get(code) ?? code}</span>)
                },
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ row }) => (
                    <Badge variant="outline" className={roleStyles[row.original.role]}>
                        {row.original.role}
                    </Badge>
                ),
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit user" onClick={() => onEdit(row.original)}>
                            <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete user" onClick={() => onDelete(row.original)}>
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
                                No users found.
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