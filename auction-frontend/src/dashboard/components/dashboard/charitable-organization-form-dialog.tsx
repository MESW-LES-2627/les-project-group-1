import { useState } from "react"
import { useCreateCharitableOrganization, useUpdateCharitableOrganization } from "@/dashboard/hooks/use-charitable-organizations"
import { getErrorMessage } from "@/lib/http"
import { flagEmoji } from "@/lib/utils"
import { COUNTRIES } from "@/lib/countries"
import type {
  CharitableOrganization,
  UpdateCharitableOrganization,
} from "@/dashboard/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog"

/**
 * Modal dialog component used to create or edit a charitable organization.
 * Handles form state, input validation, and API submission for name, description, and logo URL.
 * Automatically resets its fields upon closing and displays server error messages when needed.
 */

interface CharitableOrganizationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: CharitableOrganization | null
}

export function CharitableOrganizationFormDialog({
  open,
  onOpenChange,
  organization,
}: CharitableOrganizationFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {organization ? "Edit charitable organization" : "Add charitable organization"}
          </DialogTitle>
          <DialogDescription>
            {organization
              ? "Change the fields you want to update."
              : "Fill in the details of the new charitable organization."}
          </DialogDescription>
        </DialogHeader>
        <CharitableOrganizationForm
          organization={organization}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function CharitableOrganizationForm({
  organization,
  onDone,
}: {
  organization?: CharitableOrganization | null
  onDone: () => void
}) {
  const [name, setName] = useState(organization?.name ?? "")
  const [description, setDescription] = useState(organization?.description ?? "")
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl ?? "")
  const [country, setCountry] = useState(organization?.country ?? "")
  const [verified, setVerified] = useState(organization?.verified ?? false)

  const create = useCreateCharitableOrganization()
  const update = useUpdateCharitableOrganization()
  const mutation = organization ? update : create

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const normalizedLogoUrl = logoUrl.trim() || null

    if (organization) {
      const values: UpdateCharitableOrganization = {}
      if (trimmedName !== organization.name) values.name = trimmedName
      if (trimmedDescription !== organization.description)
        values.description = trimmedDescription
      if (normalizedLogoUrl !== organization.logoUrl) values.logoUrl = normalizedLogoUrl
      if (country !== organization.country) values.country = country
      if (verified !== organization.verified) values.verified = verified

      if (Object.keys(values).length === 0) return onDone()
      update.mutate({ id: organization.id, values }, { onSuccess: onDone })
    } else {
      create.mutate(
        {
          name: trimmedName,
          description: trimmedDescription,
          logoUrl: normalizedLogoUrl,
          country,
          verified,
        },
        { onSuccess: onDone }
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Name" htmlFor="charity-name">
        <Input
          id="charity-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. UNICEF"
          required
        />
      </Field>

      <Field label="Description" htmlFor="charity-description">
        <textarea
          id="charity-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the organization and its social cause..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Field>

      <Field label="Logo URL (optional)" htmlFor="charity-logo-url">
        <Input
          id="charity-logo-url"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </Field>

      <Field label="Country" htmlFor="charity-country">
        <select
          id="charity-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">No country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {flagEmoji(c.code)} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Verified (available for clubs to select)
      </label>

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(
            mutation.error,
            "Couldn’t save the charitable organization. Try again."
          )}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving…"
            : organization
              ? "Save changes"
              : "Add organization"}
        </Button>
      </DialogFooter>
    </form>
  )
}