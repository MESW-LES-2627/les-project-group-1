import { useDeleteUser } from "@/dashboard/hooks/use-users"
import { getErrorMessage } from "@/lib/http"
import type { User } from "@/dashboard/lib/api.ts"
import { Button } from "@/components/ui/button.tsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/dashboard/components/ui/dialog"

interface DeleteUserDialogProps {
    user: User | null // null = closed
    onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ user, onOpenChange }: DeleteUserDialogProps) {
    const del = useDeleteUser()

    function handleOpenChange(open: boolean) {
        if (!open) del.reset() // clear an old error
        onOpenChange(open)
    }

    function handleDelete() {
        if (!user) return
        del.mutate(user.id, { onSuccess: () => handleOpenChange(false) })
    }

    return (
        <Dialog open={!!user} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete user</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{user?.username}</strong>? This can’t be undone.
                    </DialogDescription>
                </DialogHeader>

                {del.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {getErrorMessage(del.error, "Couldn’t delete the user. Try again.")}
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