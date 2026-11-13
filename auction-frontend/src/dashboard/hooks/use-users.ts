import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createUser, deleteUser, fetchUsers, updateUser, type UpdateUser, type UsersParams } from "@/dashboard/lib/api"

export function useUsers(params: UsersParams) {
  return useQuery({
    queryKey: ["users", params], // changes when page, search or role change, so it refetches
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData, // keep showing the old page while the next one loads
  })
}

function useRefreshUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["users"] })
}

export function useCreateUser() {
  const refresh = useRefreshUsers()
  return useMutation({ mutationFn: createUser, onSuccess: refresh })
}

export function useUpdateUser() {
  const refresh = useRefreshUsers()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateUser }) => updateUser(id, values),
    onSuccess: refresh,
  })
}

export function useDeleteUser() {
  const refresh = useRefreshUsers()
  return useMutation({ mutationFn: deleteUser, onSuccess: refresh })
}