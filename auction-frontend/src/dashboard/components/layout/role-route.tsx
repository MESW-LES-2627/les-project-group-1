import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/auth-context"

// Where each role lands in the dashboard. Buyers have no dashboard, so they go back to the site.
export function homePathFor(role: string | undefined) {
  if (role === "ADMIN") return "/dashboard"
  if (role === "CLUB") return "/dashboard/listings"
  return "/"
}

/**
 * Only the given roles can open the routes inside. Everyone else is sent to their own home.
 * Use it after ProtectedRoute, which already makes sure someone is signed in.
 */
export function RoleRoute({ allow }: { allow: string[] }) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) return <Navigate to={homePathFor(user?.role)} replace />
  return <Outlet />
}
