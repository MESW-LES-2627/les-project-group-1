import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchClubs,
  updateClubStatus,
  type ClubStatus,
  type ClubsParams,
} from "@/dashboard/lib/api"

export function useClubs(params: ClubsParams) {
  return useQuery({
    queryKey: ["clubs", params],
    queryFn: () => fetchClubs(params),
    placeholderData: keepPreviousData,
  })
}

function useRefreshClubs() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["clubs"] })
}

export function useUpdateClubStatus() {
  const refresh = useRefreshClubs()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ClubStatus }) => updateClubStatus(id, status),
    onSuccess: refresh,
  })
}
