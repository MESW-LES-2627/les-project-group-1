import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCharitableOrganization,
  deleteCharitableOrganization,
  fetchCharitableOrganizations,
  updateCharitableOrganization,
  type CharitableOrganizationsParams,
  type UpdateCharitableOrganization,
} from "@/dashboard/lib/api"

/**
 * Custom React Query hooks for managing charitable organizations in the admin dashboard.
 * Provides data fetching with pagination/search and mutations for creating, updating, and deleting records.
 * Automatically invalidates cached queries to keep the UI synchronized after any mutation.
 */

export function useCharitableOrganizations(params: CharitableOrganizationsParams) {
  return useQuery({
    queryKey: ["charitable-organizations", params],
    queryFn: () => fetchCharitableOrganizations(params),
    placeholderData: keepPreviousData,
  })
}

function useRefreshCharitableOrganizations() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["charitable-organizations"] })
}

export function useCreateCharitableOrganization() {
  const refresh = useRefreshCharitableOrganizations()
  return useMutation({ mutationFn: createCharitableOrganization, onSuccess: refresh })
}

export function useUpdateCharitableOrganization() {
  const refresh = useRefreshCharitableOrganizations()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateCharitableOrganization }) =>
      updateCharitableOrganization(id, values),
    onSuccess: refresh,
  })
}

export function useDeleteCharitableOrganization() {
  const refresh = useRefreshCharitableOrganizations()
  return useMutation({ mutationFn: deleteCharitableOrganization, onSuccess: refresh })
}