import { useEffect, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { assetUrl } from "@/lib/assets"
import { Button } from "@/dashboard/components/ui/button.tsx"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB per image, same as the server
const MAX_IMAGES = 10

export interface ImageSelection {
  removed: string[] // paths of existing images to delete
  added: File[] // new files to upload
}

export const EMPTY_SELECTION: ImageSelection = { removed: [], added: [] }

interface ImagePickerProps {
  label: string
  existing: string[] // images the listing already has (empty when creating)
  value: ImageSelection
  onChange: (value: ImageSelection) => void
}

/** Shows the current images and lets the club remove them or add new files. Nothing is uploaded until the form is saved. */
export function ImagePicker({ label, existing, value, onChange }: ImagePickerProps) {
  const [error, setError] = useState("")
  const [previews, setPreviews] = useState<string[]>([])

  // Preview URLs for the new files. They are created and released here so they never leak.
  useEffect(() => {
    const urls = value.added.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [value.added])

  const kept = existing.filter((path) => !value.removed.includes(path))
  const total = kept.length + value.added.length

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = "" // so the same file can be picked again
    if (picked.length === 0) return

    if (picked.some((file) => !ALLOWED_TYPES.includes(file.type))) return setError("Only PNG, JPEG or WebP images.")
    if (picked.some((file) => file.size > MAX_BYTES)) return setError("Each image can be at most 2 MB.")
    if (total + picked.length > MAX_IMAGES) return setError(`You can have up to ${MAX_IMAGES} images here.`)

    setError("")
    onChange({ ...value, added: [...value.added, ...picked] })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <ImagePlus /> Add images
            <input type="file" accept={ALLOWED_TYPES.join(",")} multiple className="sr-only" onChange={handlePick} />
          </label>
        </Button>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet. PNG, JPEG or WebP, up to 2 MB each.</p>
      ) : (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {kept.map((path) => (
            <li key={path} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
              <img src={assetUrl(path)} alt="" className="size-full object-cover" />
              <RemoveButton
                label="Remove image"
                onClick={() => onChange({ ...value, removed: [...value.removed, path] })}
              />
            </li>
          ))}
          {value.added.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
              {previews[index] && <img src={previews[index]} alt="" className="size-full object-cover" />}
              <RemoveButton
                label="Remove new image"
                onClick={() => onChange({ ...value, added: value.added.filter((_, i) => i !== index) })}
              />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
    >
      <X className="size-3.5" />
    </button>
  )
}
