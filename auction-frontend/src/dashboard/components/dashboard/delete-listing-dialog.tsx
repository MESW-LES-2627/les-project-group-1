import { useDeleteMyListing } from "@/dashboard/hooks/use-my-listings"
import { getClubErrorMessage } from "@/dashboard/lib/club-errors"
import type { MyListing } from "@/dashboard/lib/club-api"
import { Button } from "@/components/ui/button.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog"

interface DeleteListingDialogProps {
  listing: MyListing | null // null = closed
  onOpenChange: (open: boolean) => void
}

export function DeleteListingDialog({ listing, onOpenChange }: DeleteListingDialogProps) {
  const del = useDeleteMyListing()

  function handleOpenChange(open: boolean) {
    if (!open) del.reset() // clear an old error
    onOpenChange(open)
  }

  function handleDelete() {
    if (!listing) return
    del.mutate(listing.id, { onSuccess: () => handleOpenChange(false) })
  }

  return (
    <Dialog open={!!listing} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{listing?.title}</strong>? Its images are deleted too. This can’t
            be undone.
          </DialogDescription>
        </DialogHeader>

        {del.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getClubErrorMessage(del.error, "Couldn’t delete the listing. Try again.")}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
