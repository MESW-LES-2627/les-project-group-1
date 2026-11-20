import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelMyListing,
  createMyListing,
  deleteMyListing,
  fetchCategories,
  fetchMyListing,
  fetchMyListings,
  fetchSelectableCharities,
  submitMyListing,
  updateMyListing,
  type ListingPayload,
  type MyListingsParams,
} from "@/dashboard/lib/club-api"

/** React Query hooks for the club's own listings. Every change refreshes the list. */

export function useMyListings(params: MyListingsParams, enabled = true) {
  return useQuery({
    queryKey: ["my-listings", params],
    queryFn: () => fetchMyListings(params),
    placeholderData: keepPreviousData,
    enabled,
    retry: false,
  })
}

/** One listing with its bids, for the details view. Only fetched while the view is open. */
export function useMyListing(id: number | null) {
  return useQuery({
    queryKey: ["my-listings", "details", id],
    queryFn: () => fetchMyListing(id!),
    enabled: id !== null,
    retry: false,
  })
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: Infinity })
}

/** Verified charities only, as returned by the public endpoint. */
export function useSelectableCharities() {
  return useQuery({ queryKey: ["selectable-charities"], queryFn: fetchSelectableCharities, staleTime: Infinity })
}

function useRefreshMyListings() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["my-listings"] })
}

export function useCreateMyListing() {
  const refresh = useRefreshMyListings()
  return useMutation({ mutationFn: (payload: ListingPayload) => createMyListing(payload), onSuccess: refresh })
}

export function useUpdateMyListing() {
  const refresh = useRefreshMyListings()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ListingPayload }) => updateMyListing(id, payload),
    onSuccess: refresh,
  })
}

export function useSubmitMyListing() {
  const refresh = useRefreshMyListings()
  return useMutation({ mutationFn: submitMyListing, onSuccess: refresh })
}

export function useCancelMyListing() {
  const refresh = useRefreshMyListings()
  return useMutation({ mutationFn: cancelMyListing, onSuccess: refresh })
}

export function useDeleteMyListing() {
  const refresh = useRefreshMyListings()
  return useMutation({ mutationFn: deleteMyListing, onSuccess: refresh })
}
