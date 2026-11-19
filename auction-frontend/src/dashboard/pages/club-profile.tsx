import { useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { useMyClub, useRemoveMyLogo, useUpdateMyClub, useUploadMyLogo } from "@/dashboard/hooks/use-club"
import { getClubErrorMessage } from "@/dashboard/lib/club-errors"
import { CLUB_APPROVED, type MyClub } from "@/dashboard/lib/club-api"
import { assetUrl } from "@/lib/assets"
import { Badge } from "@/dashboard/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/dashboard/components/ui/card"
import { Field, textareaClass } from "@/dashboard/components/dashboard/field"

/** The club's own profile: name, description and logo. A club can edit these while it is still waiting for approval. */

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"]
const LOGO_MAX_BYTES = 2 * 1024 * 1024

export default function ClubProfilePage() {
  const { data: club, isPending, isError, error, refetch } = useMyClub()

  if (isPending) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 p-4 text-sm">
        <p className="font-medium">Couldn’t load your club</p>
        <p className="text-muted-foreground">{getClubErrorMessage(error)}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return <ClubProfileView club={club} />
}

function ClubProfileView({ club }: { club: MyClub }) {
  const [name, setName] = useState(club.name)
  const [description, setDescription] = useState(club.description ?? "")
  const [logoError, setLogoError] = useState("")

  const update = useUpdateMyClub()
  const upload = useUploadMyLogo()
  const remove = useRemoveMyLogo()

  const approved = club.status === CLUB_APPROVED
  const logo = assetUrl(club.logoUrl)
  const initials = club.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // Send only what changed
    const values: { name?: string; description?: string } = {}
    if (name.trim() !== club.name) values.name = name.trim()
    if (description.trim() !== (club.description ?? "")) values.description = description.trim()
    if (Object.keys(values).length === 0) return
    update.mutate(values)
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // so the same file can be picked again
    if (!file) return

    if (!LOGO_TYPES.includes(file.type)) return setLogoError("The logo must be a PNG, JPEG or WebP image.")
    if (file.size > LOGO_MAX_BYTES) return setLogoError("The logo can be at most 2 MB.")

    setLogoError("")
    upload.mutate(file, {
      onError: (err) => setLogoError(getClubErrorMessage(err, "Couldn’t upload the logo. Try again.")),
    })
  }

  function handleRemoveLogo() {
    setLogoError("")
    remove.mutate(undefined, {
      onError: (err) => setLogoError(getClubErrorMessage(err, "Couldn’t remove the logo. Try again.")),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Club profile</h1>
        <Badge
          variant="outline"
          className={
            approved
              ? "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
              : "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          }
        >
          {approved ? "Approved" : "Waiting for approval"}
        </Badge>
      </div>

      {!approved && (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          An administrator has to approve your club before you can add listings.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>PNG, JPEG or WebP, up to 2 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
              {logo ? (
                <img src={logo} alt={`${club.name} logo`} className="size-full object-contain p-1" />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground" aria-hidden="true">
                  {initials}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <ImagePlus /> {upload.isPending ? "Uploading…" : logo ? "Change logo" : "Upload logo"}
                  <input
                    type="file"
                    accept={LOGO_TYPES.join(",")}
                    className="sr-only"
                    onChange={handleLogo}
                    disabled={upload.isPending}
                  />
                </label>
              </Button>
              {logo && (
                <Button variant="ghost" size="sm" onClick={handleRemoveLogo} disabled={remove.isPending}>
                  <Trash2 /> Remove
                </Button>
              )}
            </div>
          </div>
          {logoError && (
            <p role="alert" className="text-sm text-destructive">
              {logoError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Shown on your public club page at /club/{club.slug}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Club name" htmlFor="club-name">
              <Input
                id="club-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  update.reset()
                }}
                required
              />
            </Field>

            <Field label="Description" htmlFor="club-description">
              <textarea
                id="club-description"
                className={textareaClass}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  update.reset()
                }}
                placeholder="A short description of the club"
              />
            </Field>

            {update.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getClubErrorMessage(update.error, "Couldn’t save the club. Try again.")}
              </p>
            )}
            {update.isSuccess && (
              <p role="status" className="text-sm text-green-700 dark:text-green-400">
                Club profile saved.
              </p>
            )}

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
