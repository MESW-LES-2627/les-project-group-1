import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchMyClub, removeMyLogo, updateMyClub, uploadMyLogo } from "@/dashboard/lib/club-api"

/** React Query hooks for the logged-in club's own profile and logo. */

export function useMyClub() {
  return useQuery({
    queryKey: ["my-club"],
    queryFn: fetchMyClub,
    retry: false, // a 404 or 403 here is an answer, not a glitch
  })
}

function useRefreshMyClub() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["my-club"] })
}

export function useUpdateMyClub() {
  const refresh = useRefreshMyClub()
  return useMutation({ mutationFn: updateMyClub, onSuccess: refresh })
}

export function useUploadMyLogo() {
  const refresh = useRefreshMyClub()
  return useMutation({ mutationFn: uploadMyLogo, onSuccess: refresh })
}

export function useRemoveMyLogo() {
  const refresh = useRefreshMyClub()
  return useMutation({ mutationFn: removeMyLogo, onSuccess: refresh })
}
