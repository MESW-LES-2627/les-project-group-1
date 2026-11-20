import type { MyListing } from "./club-api.ts"

/**
 * The listing form keeps everything as text, like the inputs do. These helpers convert between
 * a listing from the API and the form values, and build the fields to send (only what changed).
 */

export const PLAYER_DETAIL_FIELDS = [
  { key: "nickname", label: "Nickname", numeric: false },
  { key: "age", label: "Age", numeric: true },
  { key: "position", label: "Position", numeric: false },
  { key: "number", label: "Shirt number", numeric: true },
  { key: "size", label: "Size", numeric: false },
  { key: "nationality", label: "Nationality", numeric: false },
  { key: "placeOfBirth", label: "Place of birth", numeric: false },
  { key: "preferredFoot", label: "Preferred foot", numeric: false },
] as const

type PlayerDetails = Record<string, string | number>

export interface ListingFormValues {
  categoryId: string
  title: string
  description: string
  playerName: string
  season: string
  competition: string
  match: string
  tags: string // separated by commas
  authenticityNotes: string
  startingPrice: string
  auctionEndsAt: string // value of <input type="datetime-local">, in the user's time zone
  charitableOrganizationId: string
  donationPercentage: string
  playerDetails: Record<string, string>
}

const SIMPLE_KEYS = [
  "categoryId",
  "title",
  "description",
  "playerName",
  "season",
  "competition",
  "match",
  "authenticityNotes",
  "startingPrice",
  "charitableOrganizationId",
  "donationPercentage",
] as const

export function emptyForm(): ListingFormValues {
  return {
    categoryId: "",
    title: "",
    description: "",
    playerName: "",
    season: "",
    competition: "",
    match: "",
    tags: "",
    authenticityNotes: "",
    startingPrice: "",
    auctionEndsAt: "",
    charitableOrganizationId: "",
    donationPercentage: "",
    playerDetails: {},
  }
}

// ISO date from the API -> value for <input type="datetime-local">
export function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formFromListing(listing: MyListing): ListingFormValues {
  const details: Record<string, string> = {}
  for (const { key } of PLAYER_DETAIL_FIELDS) {
    const value = listing.playerDetails?.[key]
    if (value !== undefined && value !== null) details[key] = String(value)
  }

  return {
    categoryId: String(listing.categoryId),
    title: listing.title,
    description: listing.description,
    playerName: listing.playerName ?? "",
    season: listing.season ?? "",
    competition: listing.competition ?? "",
    match: listing.match ?? "",
    tags: listing.tags.join(", "),
    authenticityNotes: listing.authenticityNotes ?? "",
    startingPrice: listing.startingPrice === null ? "" : String(listing.startingPrice),
    auctionEndsAt: toLocalInput(listing.auctionEndsAt),
    charitableOrganizationId:
      listing.charitableOrganizationId === null ? "" : String(listing.charitableOrganizationId),
    donationPercentage: listing.donationPercentage === null ? "" : String(listing.donationPercentage),
    playerDetails: details,
  }
}

function parseTags(text: string): string[] {
  const tags: string[] = []
  for (const part of text.split(",")) {
    const tag = part.trim()
    if (tag && !tags.includes(tag)) tags.push(tag)
  }
  return tags
}

// The known player fields from the form, plus any other keys the listing already had
function buildDetails(values: Record<string, string>, original: PlayerDetails | null): PlayerDetails | null {
  const result: PlayerDetails = { ...(original ?? {}) }
  for (const { key, numeric } of PLAYER_DETAIL_FIELDS) {
    const text = (values[key] ?? "").trim()
    if (text === "") delete result[key]
    else result[key] = numeric && Number.isFinite(Number(text)) ? Number(text) : text
  }
  return Object.keys(result).length > 0 ? result : null
}

function stable(details: PlayerDetails | null): string {
  if (!details) return ""
  return JSON.stringify(Object.keys(details).sort().map((key) => [key, details[key]]))
}

/**
 * The text fields to send. Creating: `initial` is emptyForm(), so only the filled-in fields are sent.
 * Editing: `initial` is the form of the saved listing, so only the changed fields are sent.
 * An emptied field is sent as "", which clears it on the server.
 */
export function formToFields(
  values: ListingFormValues,
  initial: ListingFormValues,
  original?: MyListing | null
): Record<string, string> {
  const fields: Record<string, string> = {}

  for (const key of SIMPLE_KEYS) {
    const next = values[key].trim()
    if (next !== initial[key].trim()) fields[key] = next
  }

  if (values.auctionEndsAt !== initial.auctionEndsAt) {
    fields.auctionEndsAt = values.auctionEndsAt ? new Date(values.auctionEndsAt).toISOString() : ""
  }

  const tags = parseTags(values.tags)
  if (JSON.stringify(tags) !== JSON.stringify(parseTags(initial.tags))) fields.tags = JSON.stringify(tags)

  const originalDetails = original?.playerDetails ?? null
  const details = buildDetails(values.playerDetails, originalDetails)
  if (stable(details) !== stable(buildDetails(initial.playerDetails, originalDetails))) {
    fields.playerDetails = details ? JSON.stringify(details) : ""
  }

  return fields
}

// Listings the club can still edit or send for verification
export function isEditable(status: MyListing["status"]) {
  return status === "draft" || status === "rejected"
}
