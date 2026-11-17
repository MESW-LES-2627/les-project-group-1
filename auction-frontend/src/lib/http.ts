import axios from "axios"
import { clearSession, loadSession } from "@/lib/auth-storage"

// One axios instance for the whole app, like a shared axios instance in Vue.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
})

// Add the token to every request
http.interceptors.request.use((config) => {
  const session = loadSession()
  if (session) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

// If the token is expired or invalid, sign out and go to the login page
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login")
    if (error.response?.status === 401 && !isLoginRequest) {
      clearSession()
      window.location.assign("/login")
    }
    return Promise.reject(error)
  }
)

// Pull a readable message out of an axios error
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? (error.response ? fallback : "Can't reach the server.")
  }
  return fallback
}
