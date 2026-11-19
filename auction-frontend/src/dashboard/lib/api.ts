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