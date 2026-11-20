import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useClubs, useUpdateClubStatus } from "@/dashboard/hooks/use-clubs"
import { useDebounce } from "@/dashboard/hooks/use-debounce"
import { getErrorMessage } from "@/lib/http"
import { CLUB_STATUSES, type Club, type ClubStatus } from "@/dashboard/lib/api"
import { ClubsTable } from "@/dashboard/components/dashboard/clubs-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 10

export default function Clubs() {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<ClubStatus | "">("")
    const [page, setPage] = useState(1)

    const debouncedSearch = useDebounce(search)
    const updateStatus = useUpdateClubStatus()

    const { data, isPending, isError, error, refetch, isPlaceholderData } = useClubs({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
    })

    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const to = Math.min(page * PAGE_SIZE, total)

    useEffect(() => {
        if (data && page > 1 && data.clubs.length === 0) setPage((p) => p - 1)
    }, [data, page])

    function handleStatus(club: Club, next: ClubStatus) {
        updateStatus.reset()
        updateStatus.mutate({ id: club.id, status: next })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Clubs</h1>
                <p className="text-sm text-muted-foreground">
                    Approve or reject clubs after they create their account.
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative max-w-sm flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clubs or owners"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-8"
                        aria-label="Search clubs"
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value as ClubStatus | "")
                        setPage(1)
                    }}
                    aria-label="Filter by status"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">All statuses</option>
                    {CLUB_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            {updateStatus.isError && (
                <div role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">
                    <p className="font-medium">Couldn’t update the club</p>
                    <p className="text-muted-foreground">{getErrorMessage(updateStatus.error)}</p>
                </div>
            )}

            {isPending && <p className="text-sm text-muted-foreground">Loading clubs…</p>}

            {isError && (
                <div className="rounded-xl border border-destructive/40 p-4 text-sm">
                    <p className="font-medium">Couldn’t load clubs</p>
                    <p className="text-muted-foreground">{getErrorMessage(error)}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                        Try again
                    </Button>
                </div>
            )}

            {data && (
                <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
                    <ClubsTable
                        data={data.clubs}
                        onChangeStatus={handleStatus}
                        updatingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
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
        </div>
    )
}
