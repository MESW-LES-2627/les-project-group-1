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