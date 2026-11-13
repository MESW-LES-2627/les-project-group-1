import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth-context"

// Like a Vue Router navigation guard: no token, no access.
export function ProtectedRoute() {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/dashboard/login" replace state={{ from: location }} />
  return <Outlet />
}
