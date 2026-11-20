import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { http } from "@/lib/http"
import { clearSession, loadSession, saveSession, type AuthUser, type Session } from "@/lib/auth-storage"

interface LoginResponse {
  message: string
  user: AuthUser
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const queryClient = useQueryClient()

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await http.post<LoginResponse>("/auth/login", { email, password })
    const next = { token: data.token, user: data.user }
    saveSession(next)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear() // drop cached data from the previous user
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, login, logout }),
    [session, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
