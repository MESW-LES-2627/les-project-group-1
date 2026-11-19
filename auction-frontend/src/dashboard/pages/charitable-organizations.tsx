import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { useCharitableOrganizations } from "@/dashboard/hooks/use-charitable-organizations"
import { useDebounce } from "@/dashboard/hooks/use-debounce"
import { getErrorMessage } from "@/lib/http"
import type { CharitableOrganization } from "@/dashboard/lib/api"
import { CharitableOrganizationsTable } from "@/dashboard/components/dashboard/charitable-organizations-table"
import { CharitableOrganizationFormDialog } from "@/dashboard/components/dashboard/charitable-organization-form-dialog"
import { DeleteCharitableOrganizationDialog } from "@/dashboard/components/dashboard/delete-charitable-organization-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Main admin dashboard page for managing charitable organizations.
 * Integrates debounced search, pagination controls, the data table, and create/edit/delete modals.
 * Automatically adjusts the current page if the last item on a page is removed.
 */

const PAGE_SIZE = 10

export default function CharitableOrganizations() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CharitableOrganization | null>(null)
  const [deleting, setDeleting] = useState<CharitableOrganization | null>(null)

  const debouncedSearch = useDebounce(search)

  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useCharitableOrganizations({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
    })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  useEffect(() => {
    if (data && page > 1 && data.organizations.length === 0) setPage((p) => p - 1)
  }, [data, page])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(organization: CharitableOrganization) {
    setEditing(organization)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Charitable Organizations</h1>
        <Button onClick={openCreate}>
          <Plus /> Add organization
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-8"
            aria-label="Search organizations"
          />
        </div>
      </div>

      {isPending && (
        <p className="text-sm text-muted-foreground">Loading charitable organizations…</p>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 p-4 text-sm">
          <p className="font-medium">Couldn’t load charitable organizations</p>
          <p className="text-muted-foreground">{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <CharitableOrganizationsTable
            data={data.organizations}
            onEdit={openEdit}
            onDelete={setDeleting}
          />

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {from}–{to} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
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

      <CharitableOrganizationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editing}
      />
      <DeleteCharitableOrganizationDialog
        organization={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  )
}