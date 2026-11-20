import { NavLink } from "react-router-dom"
import {LayoutDashboard, Users, BarChart3, Settings, X, HeartHandshake, Building2, Shirt} from "lucide-react"
import { cn } from "@/lib/utils.ts"
import { Button } from "@/dashboard/components/ui/button.tsx"
import {useAuth} from "@/context/auth-context.tsx";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["ADMIN"] },
  { to: "/dashboard/users", label: "Users", icon: Users , roles: ["ADMIN"]},
  { to: "/dashboard/clubs", label: "Clubs", icon: Building2 , roles: ["ADMIN"]},
  { to: "/dashboard/listings", label: "Listings", icon: Shirt, roles: ["ADMIN"] },
  { to: "/dashboard/charitable-organizations", label: "Charities", icon: HeartHandshake , roles: ["ADMIN"]},
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 , roles: ["ADMIN"]},
  { to: "/dashboard/settings", label: "Settings", icon: Settings , roles: ["ADMIN"]},
  { to: "/dashboard/listings", label: "My listings", icon: Shirt, roles: ["CLUB"] },
  { to: "/dashboard/club", label: "Club profile", icon: Building2, roles: ["CLUB"] },

]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  const visibleLinks = links.filter((link) => user && link.roles.includes(user.role))

  return (
      <>
        {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
                open ? "translate-x-0" : "-translate-x-full"
            )}
        >
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
            <span className="font-semibold">Dashboard Panel</span>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close menu">
              <X />
            </Button>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {visibleLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                            isActive && "bg-sidebar-accent"
                        )
                    }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
            ))}
          </nav>
        </aside>
      </>
  )
}
