import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { useUsers } from "@/dashboard/hooks/use-users"
import { useDebounce } from "@/dashboard/hooks/use-debounce"
import { getErrorMessage } from "@/lib/http"
import { USER_ROLES, type User, type UserRole } from "@/dashboard/lib/api"
import { UsersTable } from "@/dashboard/components/dashboard/users-table"
import { UserFormDialog } from "@/dashboard/components/dashboard/user-form-dialog"
import { DeleteUserDialog } from "@/dashboard/components/dashboard/delete-user-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 10

export default function Users() {
    const [search, setSearch] = useState("")
    const [role, setRole] = useState<UserRole | "">("")
    const [page, setPage] = useState(1)

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<User | null>(null)
    const [deleting, setDeleting] = useState<User | null>(null)

    const debouncedSearch = useDebounce(search)

    const { data, isPending, isError, error, refetch, isPlaceholderData } = useUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: role || undefined,
    })

    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const to = Math.min(page * PAGE_SIZE, total)

    // If you delete the last user on the last page, go back one page
    useEffect(() => {
        if (data && page > 1 && data.users.length === 0) setPage((p) => p - 1)
    }, [data, page])

    function openCreate() {
        setEditing(null)
        setFormOpen(true)
    }

    function openEdit(user: User) {
        setEditing(user)
        setFormOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                <Button onClick={openCreate}>
                    <Plus /> Add user
                </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative max-w-sm flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-8"
                        aria-label="Search users"
                    />
                </div>
                <select
                    value={role}
                    onChange={(e) => {
                        setRole(e.target.value as UserRole | "")
                        setPage(1)
                    }}
                    aria-label="Filter by role"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All roles</option>
                    {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            {isPending && <p className="text-sm text-muted-foreground">Loading users…</p>}

            {isError && (
                <div className="rounded-xl border border-destructive/40 p-4 text-sm">
                    <p className="font-medium">Couldn’t load users</p>
                    <p className="text-muted-foreground">{getErrorMessage(error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                        Try again
                    </Button>
                </div>
            )}

            {data && (
                <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
                    <UsersTable data={data.users} onEdit={openEdit} onDelete={setDeleting} />

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

            <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
            <DeleteUserDialog user={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
        </div>
    )
}