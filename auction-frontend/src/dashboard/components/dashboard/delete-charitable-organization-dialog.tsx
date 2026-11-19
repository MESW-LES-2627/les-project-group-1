import { useDeleteCharitableOrganization } from "@/dashboard/hooks/use-charitable-organizations"
import { getErrorMessage } from "@/lib/http"
import type { CharitableOrganization } from "@/dashboard/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog"

/**
 * Confirmation modal dialog for removing a charitable organization.
 * Prompts the administrator before permanently deleting the selected record via the API.
 * Displays loading and error states while processing the deletion request.
 */

interface DeleteCharitableOrganizationDialogProps {
  organization: CharitableOrganization | null
  onOpenChange: (open: boolean) => void
}

export function DeleteCharitableOrganizationDialog({
  organization,
  onOpenChange,
}: DeleteCharitableOrganizationDialogProps) {
  const remove = useDeleteCharitableOrganization()

  function handleConfirm() {
    if (!organization) return
    remove.mutate(organization.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={!!organization} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove charitable organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">{organization?.name}</span>? It
            will no longer be available for future memorabilia actions.
          </DialogDescription>
        </DialogHeader>

        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(
              remove.error,
              "Couldn’t remove the charitable organization. Try again."
            )}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}