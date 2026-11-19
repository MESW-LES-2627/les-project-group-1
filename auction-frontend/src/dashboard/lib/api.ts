import { http } from "@/lib/http"

export const USER_ROLES = ["ADMIN", "BUYER", "CLUB"] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface User {
  id: number
  username: string
  email: string
  country: string
  role: UserRole
  createdAt: string
}

export interface UsersParams {
  page: number
  limit: number
  search?: string
  role?: UserRole
}

export interface UsersPage {
  users: User[]
  total: number
}

export interface NewUser {
  username: string
  email: string
  password: string
  country: string
  role: UserRole
}

// For editing: any of these fields, but no password
export type UpdateUser = Partial<Omit<NewUser, "password">>

interface UsersResponse {
  items: User[]
  page: number
  limit: number
  total: number
}

export async function fetchUsers(params: UsersParams): Promise<UsersPage> {
  const { data } = await http.get<UsersResponse>("/admin/users", { params })
  return { users: data.items, total: data.total }
}

export async function createUser(values: NewUser): Promise<User> {
  const { data } = await http.post("/admin/users", values)
  return data
}

export async function updateUser(id: number, values: UpdateUser): Promise<User> {
  const { data } = await http.patch(`/admin/users/${id}`, values)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await http.delete(`/admin/users/${id}`)
}

// Clubs

export const CLUB_STATUSES = ["pending", "approved", "rejected"] as const
export type ClubStatus = (typeof CLUB_STATUSES)[number]

export interface Club {
  id: number
  slug: string
  name: string
  description: string
  status: ClubStatus
  logoUrl: string | null
  createdAt: string
  user: {
    id: number
    username: string
    email: string
    country: string
  } | null
  _count: {
    listings: number
  }
}

export interface ClubsParams {
  page: number
  limit: number
  search?: string
  status?: ClubStatus
}

export interface ClubsPage {
  clubs: Club[]
  total: number
}

interface ClubsResponse {
  items: Club[]
  page: number
  limit: number
  total: number
}

export async function fetchClubs(params: ClubsParams): Promise<ClubsPage> {
  const { data } = await http.get<ClubsResponse>("/admin/clubs", { params })
  return { clubs: data.items, total: data.total }
}

export async function updateClubStatus(id: number, status: ClubStatus): Promise<Club> {
  const { data } = await http.patch(`/admin/clubs/${id}`, { status })
  return data.club
}

// Charitable Organizations

export interface CharitableOrganization {
  id: number
  name: string
  description: string
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CharitableOrganizationsParams {
  page: number
  limit: number
  search?: string
}

export interface CharitableOrganizationsPage {
  organizations: CharitableOrganization[]
  total: number
}

export interface NewCharitableOrganization {
  name: string
  description?: string
  logoUrl?: string | null
}

// Allows partial updates when editing an existing organization
export type UpdateCharitableOrganization = Partial<NewCharitableOrganization>

interface CharitableOrganizationsResponse {
  items: CharitableOrganization[]
  page: number
  limit: number
  total: number
}

export async function fetchCharitableOrganizations(
  params: CharitableOrganizationsParams
): Promise<CharitableOrganizationsPage> {
  const { data } = await http.get<CharitableOrganizationsResponse>(
    "/admin/charitable-organizations",
    { params }
  )
  return { organizations: data.items, total: data.total }
}

//Refister
export async function createCharitableOrganization(
  values: NewCharitableOrganization
): Promise<CharitableOrganization> {
  const { data } = await http.post("/admin/charitable-organizations", values)
  return data.organization
}

//Update
export async function updateCharitableOrganization(
  id: number,
  values: UpdateCharitableOrganization
): Promise<CharitableOrganization> {
  const { data } = await http.patch(`/admin/charitable-organizations/${id}`, values)
  return data.organization
}

//Delete
export async function deleteCharitableOrganization(id: number): Promise<void> {
  await http.delete(`/admin/charitable-organizations/${id}`)
}


// Admin listings

export type AdminListingStatus = "pending_verification" | "verified"
export interface AdminListingsParams {
  page: number
  limit: number
  status?: AdminListingStatus
}
export interface AdminListing {
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
  status: AdminListingStatus
  authenticityNotes: string | null
  evidenceImages: string[]
  certificateCode: string | null
  startingPrice: number | null
  auctionEndsAt: string | null
  createdAt: string
  verifiedAt: string | null
}
export interface AdminListingsPage {
  items: AdminListing[]
  total: number
}

export async function fetchAdminListings(params: AdminListingsParams): Promise<AdminListingsPage> {
  const { data } = await http.get<{ items: AdminListing[]; total: number }>("/admin/listings", { params })
  return { items: data.items, total: data.total }
}

export async function updateAdminListingStatus(
    id: number,
    status: AdminListingStatus
): Promise<AdminListing> {
  const { data } = await http.patch<AdminListing>(`/admin/listings/${id}/status`, { status })
  return data
}
