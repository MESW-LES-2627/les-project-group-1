import { useState } from "react"
import { useCreateUser, useUpdateUser } from "@/dashboard/hooks/use-users"
import { getErrorMessage } from "@/lib/http"
import { flagEmoji } from "@/lib/utils.ts"
import { COUNTRIES } from "@/lib/countries"
import { USER_ROLES, type UpdateUser, type User, type UserRole } from "@/dashboard/lib/api.ts"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/dashboard/components/ui/dialog"

interface UserFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user?: User | null // set = edit mode, empty = create mode
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Change the fields you want to update." : "Fill in the details of the new user."}
                    </DialogDescription>
                </DialogHeader>
                {/* The form only exists while the dialog is open, so its fields reset every time */}
                <UserForm user={user} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
            </label>
            {children}
        </div>
    )
}

function UserForm({ user, onDone }: { user?: User | null; onDone: () => void }) {
    const [username, setUsername] = useState(user?.username ?? "")
    const [email, setEmail] = useState(user?.email ?? "")
    const [password, setPassword] = useState("")
    const [country, setCountry] = useState(user?.country ?? "")
    const [role, setRole] = useState<UserRole>(user?.role ?? "BUYER")

    const create = useCreateUser()
    const update = useUpdateUser()
    const mutation = user ? update : create

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (user) {
            // Send only what changed
            const values: UpdateUser = {}
            if (username !== user.username) values.username = username
            if (email !== user.email) values.email = email
            if (country !== user.country) values.country = country
            if (role !== user.role) values.role = role

            if (Object.keys(values).length === 0) return onDone()
            update.mutate({ id: user.id, values }, { onSuccess: onDone })
        } else {
            create.mutate({ username, email, password, country, role }, { onSuccess: onDone })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username" htmlFor="username">
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Field>

            <Field label="Email" htmlFor="email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>

            {!user && (
                <Field label="Password" htmlFor="password">
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Field label="Country" htmlFor="country">
                    <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="" disabled>
                            Select a country
                        </option>
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {flagEmoji(c.code)} {c.name}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Role" htmlFor="role">
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {USER_ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            {mutation.isError && (
                <p role="alert" className="text-sm text-destructive">
                    {getErrorMessage(mutation.error, "Couldn’t save the user. Try again.")}
                </p>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving…" : user ? "Save changes" : "Add user"}
                </Button>
            </DialogFooter>
        </form>
    )
}