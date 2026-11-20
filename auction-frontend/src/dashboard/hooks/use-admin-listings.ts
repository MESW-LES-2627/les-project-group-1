import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelAdminListing,
  fetchAdminListings,
  updateAdminListingStatus,
  type AdminListingsParams,
  type AdminListingStatus,
} from "@/dashboard/lib/api"

export function useAdminListings(params: AdminListingsParams) {
  return useQuery({
    queryKey: ["admin-listings", params],
    queryFn: () => fetchAdminListings(params),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useUpdateAdminListingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminListingStatus }) =>
      updateAdminListingStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-listings"] }),
  })
}

export function useCancelAdminListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAdminListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-listings"] }),
  })
}
