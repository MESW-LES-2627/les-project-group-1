import { http } from "@/lib/http"

/** API calls for the club part of the dashboard: the club's own profile, logo and listings. */

// ---------- Club ----------

export const CLUB_APPROVED = "approved"

export interface MyClub {
  id: number
  slug: string
  name: string
  description: string | null
  status: string // "pending" until an admin approves the club
  logoUrl: string | null
  createdAt: string
}

export async function fetchMyClub(): Promise<MyClub> {
  const { data } = await http.get<MyClub>("/clubs/me")
  return data
}

export async function updateMyClub(values: { name?: string; description?: string }): Promise<MyClub> {
  const { data } = await http.put<{ club: MyClub }>("/clubs/me", values)
  return data.club
}

// The body of the request is the image file itself (PNG, JPEG or WebP, max 2 MB)
export async function uploadMyLogo(file: File): Promise<string> {
  const { data } = await http.put<{ logoUrl: string }>("/clubs/me/logo", file, {
    headers: { "Content-Type": file.type },
  })
  return data.logoUrl
}

export async function removeMyLogo(): Promise<void> {
  await http.delete("/clubs/me/logo")
}

// ---------- Categories ----------

export interface CategoryOption {
  id: number
  slug: string
  name: string
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const { data } = await http.get<CategoryOption[]>("/categories")
  return data
}

// ---------- Listings ----------

export const LISTING_STATUSES = ["draft", "pending_verification", "verified", "rejected"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export interface MyListing {
  id: number
  categoryId: number
  category: { slug: string; name: string }
  title: string
  playerName: string | null
  playerDetails: Record<string, string | number> | null
  season: string | null
  competition: string | null
  match: string | null
  tags: string[]
  description: string
  images: string[]
  status: ListingStatus
  authenticityNotes: string | null
  evidenceImages: string[]
  certificateCode: string | null
  startingPrice: number | null
  auctionEndsAt: string | null
  createdAt: string
  verifiedAt: string | null
}

export interface MyListingsParams {
  page: number
  limit: number
  status?: ListingStatus
}

export interface MyListingsPage {
  items: MyListing[]
  total: number
}

export async function fetchMyListings(params: MyListingsParams): Promise<MyListingsPage> {
  const { data } = await http.get<{ items: MyListing[]; total: number }>("/clubs/me/listings", { params })
  return { items: data.items, total: data.total }
}

/**
 * What is sent when a listing is created or edited. "fields" are the text fields (only the ones to
 * change when editing). Images are real files, sent in the same multipart request.
 */
export interface ListingPayload {
  fields: Record<string, string>
  images: File[]
  evidenceImages: File[]
  removeImages?: string[] // paths of existing images to delete (edit only)
  removeEvidenceImages?: string[]
}

function toFormData(payload: ListingPayload) {
  const form = new FormData()
  for (const [key, value] of Object.entries(payload.fields)) form.append(key, value)
  for (const file of payload.images) form.append("images", file)
  for (const file of payload.evidenceImages) form.append("evidenceImages", file)
  if (payload.removeImages?.length) form.append("removeImages", JSON.stringify(payload.removeImages))
  if (payload.removeEvidenceImages?.length) {
    form.append("removeEvidenceImages", JSON.stringify(payload.removeEvidenceImages))
  }
  return form
}

export async function createMyListing(payload: ListingPayload): Promise<MyListing> {
  const { data } = await http.post<MyListing>("/clubs/me/listings", toFormData(payload))
  return data
}

export async function updateMyListing(id: number, payload: ListingPayload): Promise<MyListing> {
  const { data } = await http.patch<MyListing>(`/clubs/me/listings/${id}`, toFormData(payload))
  return data
}

// Sends a draft to the admins for verification. The club can't edit it after that.
export async function submitMyListing(id: number): Promise<MyListing> {
  const { data } = await http.patch<MyListing>(`/clubs/me/listings/${id}`, { status: "pending_verification" })
  return data
}

export async function deleteMyListing(id: number): Promise<void> {
  await http.delete(`/clubs/me/listings/${id}`)
}
