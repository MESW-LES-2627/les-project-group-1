import { useMemo, useState } from "react"
import {
  useCategories,
  useCreateMyListing,
  useSelectableCharities,
  useUpdateMyListing,
} from "@/dashboard/hooks/use-my-listings"
import { getClubErrorMessage } from "@/dashboard/lib/club-errors"
import { flagEmoji } from "@/lib/utils"
import { COUNTRIES } from "@/lib/countries"
import type { ListingPayload, MyListing } from "@/dashboard/lib/club-api"
import {
  PLAYER_DETAIL_FIELDS,
  emptyForm,
  formFromListing,
  formToFields,
  type ListingFormValues,
} from "@/dashboard/lib/listing-form"
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
import { Field, selectClass, textareaClass } from "@/dashboard/components/dashboard/field"
import { EMPTY_SELECTION, ImagePicker, type ImageSelection } from "@/dashboard/components/dashboard/image-picker"

const countryNames = new Map(COUNTRIES.map((country) => [country.code, country.name]))

interface ListingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing?: MyListing | null // set = edit mode, empty = create mode
}

export function ListingFormDialog({ open, onOpenChange, listing }: ListingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{listing ? "Edit listing" : "Add listing"}</DialogTitle>
          <DialogDescription>
            {listing
              ? "Change the fields you want to update."
              : "It is saved as a draft until you submit it for verification."}
          </DialogDescription>
        </DialogHeader>
        {/* The form only exists while the dialog is open, so its fields reset every time */}
        <ListingForm listing={listing} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ListingForm({ listing, onDone }: { listing?: MyListing | null; onDone: () => void }) {
  const initial = useMemo(() => (listing ? formFromListing(listing) : emptyForm()), [listing])
  const [values, setValues] = useState<ListingFormValues>(initial)
  const [photos, setPhotos] = useState<ImageSelection>(EMPTY_SELECTION)
  const [evidence, setEvidence] = useState<ImageSelection>(EMPTY_SELECTION)

  const { data: categories, isPending: loadingCategories } = useCategories()
  const { data: charities, isPending: loadingCharities } = useSelectableCharities()
  const create = useCreateMyListing()
  const update = useUpdateMyListing()
  const mutation = listing ? update : create

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setDetail(key: string, text: string) {
    setValues((current) => ({ ...current, playerDetails: { ...current.playerDetails, [key]: text } }))
  }

  // submit = true also sends the listing for verification, in the same request
  function save(submit: boolean) {
    const fields = formToFields(values, initial, listing)
    if (submit) fields.status = "pending_verification"

    const payload: ListingPayload = {
      fields,
      images: photos.added,
      evidenceImages: evidence.added,
      removeImages: photos.removed,
      removeEvidenceImages: evidence.removed,
    }

    if (listing) {
      const imageChanges =
        photos.added.length + photos.removed.length + evidence.added.length + evidence.removed.length
      if (Object.keys(fields).length === 0 && imageChanges === 0) return onDone()
      update.mutate({ id: listing.id, payload }, { onSuccess: onDone })
    } else {
      create.mutate(payload, { onSuccess: onDone })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {listing?.status === "rejected" && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          This listing was rejected. Saving your changes turns it back into a draft that you can submit again.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="listing-title">
          <Input id="listing-title" value={values.title} onChange={(e) => set("title", e.target.value)} required />
        </Field>

        <Field label="Category" htmlFor="listing-category">
          <select
            id="listing-category"
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            required
            disabled={loadingCategories}
            className={selectClass}
          >
            <option value="" disabled>
              {loadingCategories ? "Loading…" : "Select a category"}
            </option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description" htmlFor="listing-description">
        <textarea
          id="listing-description"
          className={textareaClass}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is it, when was it worn, and by whom?"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Player name" htmlFor="listing-player">
          <Input id="listing-player" value={values.playerName} onChange={(e) => set("playerName", e.target.value)} />
        </Field>
        <Field label="Season" htmlFor="listing-season">
          <Input id="listing-season" value={values.season} onChange={(e) => set("season", e.target.value)} />
        </Field>
        <Field label="Competition" htmlFor="listing-competition">
          <Input
            id="listing-competition"
            value={values.competition}
            onChange={(e) => set("competition", e.target.value)}
          />
        </Field>
        <Field label="Match" htmlFor="listing-match">
          <Input id="listing-match" value={values.match} onChange={(e) => set("match", e.target.value)} />
        </Field>
      </div>

      <Field label="Tags (separated by commas)" htmlFor="listing-tags">
        <Input
          id="listing-tags"
          value={values.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="worn, signed"
        />
      </Field>

      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Player details</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAYER_DETAIL_FIELDS.map(({ key, label, numeric }) => (
            <Field key={key} label={label} htmlFor={`detail-${key}`}>
              <Input
                id={`detail-${key}`}
                type={numeric ? "number" : "text"}
                value={values.playerDetails[key] ?? ""}
                onChange={(e) => setDetail(key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starting price (€)" htmlFor="listing-price">
          <Input
            id="listing-price"
            type="number"
            min="0.01"
            step="0.01"
            value={values.startingPrice}
            onChange={(e) => set("startingPrice", e.target.value)}
          />
        </Field>
        <Field label="Auction ends" htmlFor="listing-ends">
          <Input
            id="listing-ends"
            type="datetime-local"
            value={values.auctionEndsAt}
            onChange={(e) => set("auctionEndsAt", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Support a charity (verified only)" htmlFor="listing-charity">
          <select
            id="listing-charity"
            value={values.charitableOrganizationId}
            onChange={(e) => {
              const id = e.target.value
              set("charitableOrganizationId", id)
              if (!id) set("donationPercentage", "")
              else if (!values.donationPercentage) set("donationPercentage", "10")
            }}
            disabled={loadingCharities}
            className={selectClass}
          >
            <option value="">{loadingCharities ? "Loading…" : "No charity"}</option>
            {charities?.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {flagEmoji(charity.country)} {charity.name}
                {charity.country
                  ? ` (${countryNames.get(charity.country.toUpperCase()) ?? charity.country})`
                  : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Donation percentage (%)" htmlFor="listing-donation">
          <Input
            id="listing-donation"
            type="number"
            min="0"
            max="100"
            step="1"
            value={values.donationPercentage}
            onChange={(e) => set("donationPercentage", e.target.value)}
            disabled={!values.charitableOrganizationId}
            placeholder="e.g. 10"
          />
          <p className="text-xs text-muted-foreground">
            Share of the winning bid donated to the selected charity.
          </p>
        </Field>
      </div>

      <ImagePicker label="Photos" existing={listing?.images ?? []} value={photos} onChange={setPhotos} />

      <Field label="Authenticity notes" htmlFor="listing-notes">
        <textarea
          id="listing-notes"
          className={textareaClass}
          value={values.authenticityNotes}
          onChange={(e) => set("authenticityNotes", e.target.value)}
          placeholder="How can a buyer be sure it is authentic?"
        />
      </Field>

      <ImagePicker
        label="Evidence photos"
        existing={listing?.evidenceImages ?? []}
        value={evidence}
        onChange={setEvidence}
      />

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getClubErrorMessage(mutation.error, "Couldn’t save the listing. Try again.")}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" onClick={() => save(true)} disabled={mutation.isPending}>
          Save & submit for verification
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : listing ? "Save changes" : "Save as draft"}
        </Button>
      </DialogFooter>
    </form>
  )
}
